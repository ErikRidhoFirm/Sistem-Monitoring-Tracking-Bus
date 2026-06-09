type HadoopHttpFsConfig = {
  baseUrl: string;
  user: string;
  basePath: string;
  insecureTls: boolean;
};

type HadoopEventBatch = {
  dataset: string;
  busId?: string;
  date: string;
  events: unknown[];
};

const DEFAULT_BASE_PATH = "/data";
const DEFAULT_USER = "hadoop";

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

function normalizeHttpFsUrl(value: string) {
  const url = new URL(value);
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/g, "");
}

function normalizeBasePath(value: string) {
  const trimmed = trimSlashes(value.trim());
  return trimmed ? `/${trimmed}` : DEFAULT_BASE_PATH;
}

function encodeHdfsPath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getConfig(): HadoopHttpFsConfig | null {
  const baseUrl = process.env.HADOOP_HTTPFS_URL || process.env.HADOOP_WEBHDFS_URL;
  if (!baseUrl) {
    return null;
  }

  return {
    baseUrl: normalizeHttpFsUrl(baseUrl),
    user: process.env.HADOOP_USER || DEFAULT_USER,
    basePath: normalizeBasePath(process.env.HADOOP_BASE_PATH || DEFAULT_BASE_PATH),
    insecureTls:
      process.env.HADOOP_HTTPFS_INSECURE_TLS === "true" ||
      process.env.HADOOP_TLS_REJECT_UNAUTHORIZED === "false",
  };
}

function withHttpFsTls(config: HadoopHttpFsConfig, init: RequestInit = {}) {
  if (!config.insecureTls) {
    return init;
  }

  return {
    ...init,
    // Bun supports this option. It is only enabled for the Hadoop dev endpoint.
    tls: {
      rejectUnauthorized: false,
    },
  } as RequestInit;
}

function buildUrl(config: HadoopHttpFsConfig, hdfsPath: string, op: string) {
  const url = new URL(`${config.baseUrl}${encodeHdfsPath(hdfsPath)}`);
  url.searchParams.set("op", op);
  url.searchParams.set("user.name", config.user);
  return url;
}

function isDirectDataNode(config: HadoopHttpFsConfig) {
  return new URL(config.baseUrl).port === "9864";
}

async function requestHttpFs(
  config: HadoopHttpFsConfig,
  hdfsPath: string,
  op: string,
  init: RequestInit = {},
) {
  return fetch(buildUrl(config, hdfsPath, op), withHttpFsTls(config, init));
}

async function pathExists(config: HadoopHttpFsConfig, hdfsPath: string) {
  const response = await requestHttpFs(config, hdfsPath, "GETFILESTATUS", {
    method: "GET",
  });

  if (response.status === 200) {
    return true;
  }

  if (response.status === 404) {
    return false;
  }

  const body = await response.text();
  throw new Error(
    `HttpFS GETFILESTATUS failed for ${hdfsPath}: ${response.status} ${body}`,
  );
}

async function ensureDirectory(config: HadoopHttpFsConfig, hdfsPath: string) {
  const response = await requestHttpFs(config, hdfsPath, "MKDIRS", {
    method: "PUT",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HttpFS MKDIRS failed for ${hdfsPath}: ${response.status} ${body}`);
  }
}

async function writeFile(
  config: HadoopHttpFsConfig,
  hdfsPath: string,
  body: string,
) {
  const url = buildUrl(config, hdfsPath, "CREATE");
  if (isDirectDataNode(config)) {
    url.searchParams.set(
      "namenoderpcaddress",
      process.env.HADOOP_NAMENODE_RPC_ADDRESS || "namenode:9000",
    );
    url.searchParams.set("createflag", "");
    url.searchParams.set("createparent", "true");
  } else {
    url.searchParams.set("data", "true");
  }
  url.searchParams.set("overwrite", "false");

  const response = await fetch(
    url,
    withHttpFsTls(config, {
      method: "PUT",
      headers: {
        "content-type": "application/octet-stream",
      },
      body,
    }),
  );

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `HttpFS CREATE failed for ${hdfsPath}: ${response.status} ${responseBody}`,
    );
  }
}

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    throw new Error(`Invalid Hadoop batch date: ${date}`);
  }

  return { year, month, day };
}

function buildBatchFileName(dataset: string, busId?: string) {
  const now = new Date();
  const compactDate = now.toISOString().slice(0, 10).replace(/-/g, "");
  const hourMinute = now.toISOString().slice(11, 16).replace(":", "");
  const suffix = Math.random().toString(36).slice(2, 8);
  const scope = dataset === "tracking" && busId ? `_${busId}` : "";
  return `${dataset}_${compactDate}_${hourMinute}${scope}_${suffix}.jsonl`;
}

function buildPartitionDirectory(input: {
  basePath: string;
  dataset: string;
  year: string;
  month: string;
  day: string;
  busId?: string;
}) {
  const dailyDirectory = `${input.basePath}/${input.dataset}/year=${input.year}/month=${input.month}/day=${input.day}`;

  if (input.dataset === "tracking" && input.busId) {
    return `${dailyDirectory}/busId=${input.busId}`;
  }

  return dailyDirectory;
}

export async function appendHadoopJsonLines(input: HadoopEventBatch) {
  if (input.events.length === 0) {
    return;
  }

  const config = getConfig();
  if (!config) {
    console.warn(
      "[hadoop-httpfs] skip write due to missing HADOOP_HTTPFS_URL or HADOOP_WEBHDFS_URL",
    );
    return;
  }

  const safeDataset = trimSlashes(input.dataset);
  const safeDate = input.date.replace(/[^0-9-]/g, "");
  const safeBusId = input.busId?.replace(/[\\/]/g, "-");
  const { year, month, day } = parseDateParts(safeDate);
  const directory = buildPartitionDirectory({
    basePath: config.basePath,
    dataset: safeDataset,
    year,
    month,
    day,
    busId: safeBusId,
  });
  const filePath = `${directory}/${buildBatchFileName(safeDataset, safeBusId)}`;
  const body = `${input.events.map((event) => JSON.stringify(event)).join("\n")}\n`;

  console.log("[hadoop-httpfs] writing batch", {
    baseUrl: config.baseUrl,
    user: config.user,
    basePath: config.basePath,
    insecureTls: config.insecureTls,
    dataset: input.dataset,
    busId: input.busId,
    date: input.date,
    count: input.events.length,
    path: filePath,
  });

  if (!isDirectDataNode(config)) {
    await ensureDirectory(config, directory);
    if (await pathExists(config, filePath)) {
      throw new Error(`Generated Hadoop batch path already exists: ${filePath}`);
    }
  }
  await writeFile(config, filePath, body);

  console.log("[hadoop-httpfs] wrote batch", {
    dataset: input.dataset,
    busId: input.busId,
    date: input.date,
    count: input.events.length,
    path: filePath,
  });
}

export function getHadoopFlushIntervalMs(defaultValue: number) {
  const parsed = Number(process.env.HADOOP_FLUSH_INTERVAL_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

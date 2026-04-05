// Provider icons sourced from simple-icons (CC0 licensed)
// https://simpleicons.org
import {
  siApachecassandra,
  siApachekafka,
  siCelery,
  siCloudflare,
  siDjango,
  siElasticsearch,
  siExpress,
  siFastify,
  siFirebase,
  siGo,
  siGooglecloud,
  siKong,
  siKubernetes,
  siMeilisearch,
  siMongodb,
  siMysql,
  siNatsdotio,
  siNginx,
  siNodedotjs,
  siOpensearch,
  siPostgresql,
  siPython,
  siRabbitmq,
  siRedis,
  siSidekiq,
  siSpring,
} from "simple-icons";

export interface ProviderIconData {
  path: string;
  hex: string; // brand color without #
  viewBox?: string; // defaults to "0 0 24 24"
}

// Map provider display names to simple-icons data
const fromSimpleIcons: Record<string, ProviderIconData> = {
  Redis: { path: siRedis.path, hex: siRedis.hex },
  PostgreSQL: { path: siPostgresql.path, hex: siPostgresql.hex },
  Nginx: { path: siNginx.path, hex: siNginx.hex },
  MongoDB: { path: siMongodb.path, hex: siMongodb.hex },
  Cloudflare: { path: siCloudflare.path, hex: siCloudflare.hex },
  "Cloudflare DNS": { path: siCloudflare.path, hex: siCloudflare.hex },
  "Cloudflare WAF": { path: siCloudflare.path, hex: siCloudflare.hex },
  Elasticsearch: { path: siElasticsearch.path, hex: siElasticsearch.hex },
  Kafka: { path: siApachekafka.path, hex: siApachekafka.hex },
  RabbitMQ: { path: siRabbitmq.path, hex: siRabbitmq.hex },
  "Node.js": { path: siNodedotjs.path, hex: siNodedotjs.hex },
  Go: { path: siGo.path, hex: siGo.hex },
  "Go net/http": { path: siGo.path, hex: siGo.hex },
  Python: { path: siPython.path, hex: siPython.hex },
  "Python/Django": { path: siDjango.path, hex: siDjango.hex },
  MySQL: { path: siMysql.path, hex: siMysql.hex },
  Kubernetes: { path: siKubernetes.path, hex: siKubernetes.hex },
  "K8s HPA": { path: siKubernetes.path, hex: siKubernetes.hex },
  "Spring Boot": { path: siSpring.path, hex: siSpring.hex },
  "Java/Spring": { path: siSpring.path, hex: siSpring.hex },
  Express: { path: siExpress.path, hex: siExpress.hex },
  Django: { path: siDjango.path, hex: siDjango.hex },
  Fastify: { path: siFastify.path, hex: siFastify.hex },
  Cassandra: { path: siApachecassandra.path, hex: siApachecassandra.hex },
  "Cloud CDN": { path: siGooglecloud.path, hex: siGooglecloud.hex },
  "Cloud DNS": { path: siGooglecloud.path, hex: siGooglecloud.hex },
  "Cloud SQL": { path: siGooglecloud.path, hex: siGooglecloud.hex },
  "GCP MIG": { path: siGooglecloud.path, hex: siGooglecloud.hex },
  GCS: { path: siGooglecloud.path, hex: siGooglecloud.hex },
  Firestore: { path: siFirebase.path, hex: siFirebase.hex },
  OpenSearch: { path: siOpensearch.path, hex: siOpensearch.hex },
  Meilisearch: { path: siMeilisearch.path, hex: siMeilisearch.hex },
};

// AWS smile/arrow path only (from official SVG, native viewBox 0 -51.5 256 256)
const AWS_PATH =
  "M230.993377,120.964238C203.104636,141.562914 162.58543,152.498013 127.745695,152.498013C78.9192053,152.498013 34.9245033,134.442384 1.69536424,104.434437C-0.932450331,102.060927 1.4410596,98.8397351 4.57748344,100.704636C40.5192053,121.557616 84.8529801,134.188079 130.712583,134.188079C161.65298,134.188079 195.645033,127.745695 226.924503,114.521854C231.586755,112.402649 235.570861,117.57351 230.993377,120.964238ZM242.606623,107.740397C239.046358,103.162914 219.04106,105.536424 209.970861,106.638411C207.258278,106.977483 206.834437,104.603974 209.292715,102.823841C225.229139,91.6344371 251.422517,94.8556291 254.474172,98.5854305C257.525828,102.4 253.62649,128.593377 238.707285,141.139073C236.418543,143.088742 234.21457,142.071523 235.231788,139.528477C238.622517,131.136424 246.166887,112.233113 242.606623,107.740397Z";

// Azure logo path (from official SVG, native 16x16 viewBox)
const AZURE_PATH =
  "M7.47 12.412l3.348-.592.031-.007-1.722-2.049a291.474 291.474 0 01-1.723-2.058c0-.01 1.779-4.909 1.789-4.926a788.95 788.95 0 012.934 5.066l2.95 5.115.023.039-10.948-.001 3.317-.587zM.9 11.788c0-.003.811-1.412 1.803-3.131L4.507 5.53l2.102-1.764C7.765 2.797 8.714 2 8.717 2a.37.37 0 01-.033.085L6.4 6.981 4.16 11.789l-1.63.002c-.897.001-1.63 0-1.63-.003z";

// Manually-defined icons for providers not in simple-icons (AWS, Azure, etc.)
const manualIcons: Record<string, ProviderIconData> = {
  // AWS services
  "AWS WAF": { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  "AWS ALB": { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  "AWS ASG": { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  "AWS API GW": { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  Aurora: { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  DynamoDB: { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  SQS: { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  ElastiCache: { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  S3: { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  "Route 53": { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  CloudFront: { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
  // Azure services
  "Azure Firewall": { path: AZURE_PATH, viewBox: "0 0 16 16", hex: "0089D6" },
  "Azure Blob": { path: AZURE_PATH, viewBox: "0 0 16 16", hex: "0089D6" },
  "Azure DNS": { path: AZURE_PATH, viewBox: "0 0 16 16", hex: "0089D6" },
  // Cloudflare R2
  R2: { path: siCloudflare.path, hex: siCloudflare.hex },
  // Misc
  HAProxy: {
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z",
    hex: "00B1E7",
  },
  Traefik: {
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-11l6 3-6 3z",
    hex: "24A1C1",
  },
  Kong: { path: siKong.path, hex: "003459" },
  Apigee: {
    path: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z",
    hex: "EA4335",
  },
  Memcached: {
    path: "M3 3h18v18H3zm2 2v14h14V5zm3 3h8v2H8zm0 4h8v2H8zm0 4h5v2H8z",
    hex: "51A977",
  },
  Dragonfly: {
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
    hex: "6541F5",
  },
  Typesense: {
    path: "M3 3h18v18H3zm2 2v14h14V5zm3 3h8v2H8zm0 4h8v2H8z",
    hex: "D21998",
  },
  NATS: {
    path: siNatsdotio.path,
    hex: "27AAE1",
  },
  // Worker providers
  Celery: { path: siCelery.path, hex: siCelery.hex },
  BullMQ: { path: siNodedotjs.path, hex: siNodedotjs.hex },
  Sidekiq: { path: siSidekiq.path, hex: siSidekiq.hex },
  Lambda: { path: AWS_PATH, viewBox: "0 80 256 80", hex: "FF9900" },
};

export const PROVIDER_ICONS: Record<string, ProviderIconData> = {
  ...fromSimpleIcons,
  ...manualIcons,
};

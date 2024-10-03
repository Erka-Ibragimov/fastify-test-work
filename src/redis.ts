import { FastifyInstance, FastifyPluginOptions } from "fastify";
import Redis from "ioredis";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisConnector(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
  });

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async () => {
    await redis.quit();
  });
}

export default fp(redisConnector);

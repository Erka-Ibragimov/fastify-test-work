import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fetchSkinportItems } from "./fetch/integration";

export default async function routes(server: FastifyInstance) {
  server.get("/items", async (request: FastifyRequest, reply: FastifyReply) => {
    const cachedItems = await server.redis.get("skinport_items");

    if (cachedItems) {
      return reply.send(JSON.parse(cachedItems));
    }

    const items: any = await fetchSkinportItems();

    await server.redis.set("skinport_items", JSON.stringify(items), "EX", 3600);

    reply.send(items);
  });

  server.post(
    "/deduct-balance",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId, amount } = request.body as {
        userId: number;
        amount: number;
      };

      const result = await server.pg.query(
        "SELECT balance FROM users WHERE id = $1",
        [userId]
      );
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "User not found" });
      }

      const userBalance = result.rows[0].balance;
      if (userBalance < amount) {
        return reply.status(400).send({ error: "Insufficient balance" });
      }

      await server.pg.query(
        "UPDATE users SET balance = balance - $1 WHERE id = $2",
        [amount, userId]
      );
      reply.send({ success: true });
    }
  );
}

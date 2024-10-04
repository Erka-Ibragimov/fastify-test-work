import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fetchSkinportItems } from "./integration";
import { z } from "zod";

export type AxiosResponse = {
  market_hash_name: string;
  currency: string;
  suggested_price: number;
  item_page: string;
  market_page: string;
  min_price: number;
  max_price: number;
  mean_price: number;
  median_price: number;
  quantity: number;
  created_at: number;
  updated_at: number;
};

const DeductBalanceSchema = z.object({
  userId: z.string(),
  amount: z.string(),
});

export default async function routes(server: FastifyInstance) {
  server.get("/items", async (request: FastifyRequest, reply: FastifyReply) => {
    const cachedItems = await server.redis.get("skinport_items");

    if (cachedItems) {
      return reply.send(JSON.parse(cachedItems));
    }

    const response: AxiosResponse[] = await fetchSkinportItems();

    const items = response.map((item: AxiosResponse) => ({
      market_hash_name: item.market_hash_name,
      currency: item.currency,
      suggested_price: item.suggested_price,
      item_page: item.item_page,
      market_page: item.market_page,
      min_price: item.min_price,
      max_price: item.max_price,
      mean_price: item.mean_price,
      median_price: item.median_price,
      quantity: item.quantity,
      created_at: item.created_at,
      updated_at: item.updated_at,
      tradable_min_price: true,
      non_tradable_min_price: false,
    }));

    await server.redis.set("skinport_items", JSON.stringify(items), "EX", 3600);

    reply.send(items);
  });

  server.post(
    "/deduct-balance",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = DeductBalanceSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply
          .status(400)
          .send({ error: "Invalid input", details: parseResult.error.errors });
      }

      const { userId, amount } = request.body as {
        userId: string;
        amount: string;
      };

      await server.pg.query(`
        CREATE TABLE IF NOT EXISTS users (
          id varchar NULL,
          balance varchar NULL
        );
      `);

      let result = await server.pg.query(
        "SELECT balance FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        await server.pg.query(
          "INSERT INTO users (id, balance) VALUES ($1, $2)",
          [userId, Number(amount) + 700]
        );

        result = await server.pg.query(
          "SELECT balance FROM users WHERE id = $1",
          [userId]
        );
      }

      const userBalance = result.rows[0].balance;

      if (Number(userBalance) < Number(amount)) {
        return reply.status(400).send({ error: "Insufficient balance" });
      }

      const newBalance = Number(userBalance) - Number(amount);

      await server.pg.query("UPDATE users SET balance = $1 WHERE id = $2", [
        newBalance,
        userId,
      ]);

      reply.send({ success: true });
    }
  );
}

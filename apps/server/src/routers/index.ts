import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import customersRouter from "./customers";
import menuRouter from "./menu";
import usersRouter from "./users";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import menuItemsRouter from "./menu-items";
import categoriesRouter from "./categories";
import socketAuthRouter from "./socket-auth";
import analyticsRouter from "./analytics";
import seedRouter from "./seed";

const router: ExpressRouter = Router();

// Mount routers
router.use("/customers", customersRouter);
router.use("/menu", menuRouter);
router.use("/menu-items", menuItemsRouter);
router.use("/categories", categoriesRouter);
router.use("/users", usersRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
router.use("/analytics", analyticsRouter);
router.use("/seed", seedRouter);
router.use("/", socketAuthRouter);

export default router;

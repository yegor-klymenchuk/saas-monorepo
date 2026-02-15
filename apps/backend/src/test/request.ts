import supertest from "supertest";
import { Server } from "../server";

const server = new Server();

export const request = supertest(server.app);

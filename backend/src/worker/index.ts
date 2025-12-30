import dotenv from "dotenv";
dotenv.config();

import "./analyzer.worker";
import "./planner.worker";
import "./generator.worker";
import "./deploy.worker";
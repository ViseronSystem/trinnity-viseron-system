import { AgentManager as BaseAgentManager } from "../AgentManager";
import { IAgent } from "../types";

export type Agent = IAgent;
export class AgentManager extends BaseAgentManager {}
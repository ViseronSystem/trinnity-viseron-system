import {Agent} from "../core/agents/AgentManager";


export const CEOAgent:Agent={


name:"CEO Agent",


role:"Director estratégico de TVS",



execute(task:string){

return `
CEO Agent analizando:

${task}

Plan estratégico generado.
`;

}


};
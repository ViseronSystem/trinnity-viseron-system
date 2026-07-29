import { ViseronCore } from "./core/ViseronCore";

import {AgentManager} from "./core/agents/AgentManager";

import {CEOAgent} from "./agents/CEOAgent";



const tvs=new ViseronCore();



tvs.start();



const manager=new AgentManager();



manager.register(CEOAgent);



console.log(
manager.run(
"CEO Agent",
"Crear estrategia inicial de Trinnity Viseron System"
)
);
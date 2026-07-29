import {TVSOrchestrator} from "./core/orchestrator/Orchestrator";
import {CEOAgent} from "./agents/ceo/CEOAgent";


const tvs=new TVSOrchestrator();


tvs.register(CEOAgent);


tvs.execute(
"Crear estrategia inicial de Trinnity Viseron System"
);

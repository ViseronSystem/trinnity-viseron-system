import {TVSOrchestrator} from "./core/orchestrator/Orchestrator";
import {CEOAgent} from "./agents/ceo/CEOAgent";
import {ModelRouter} from "./core/model-router/ModelRouter";


const tvs=new TVSOrchestrator();

const router=new ModelRouter();


tvs.register(CEOAgent);


const task =
"Crear arquitectura IA local";

console.log(
"TVS Router:",
router.execute(task)
);


tvs.execute(task);
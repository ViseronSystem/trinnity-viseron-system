export class ModelRouter {


select(task:string){

if(task.includes("codigo")){
return "claude/gpt";

}

if(task.includes("local")){
return "ollama";

}

return "openai";

}


}

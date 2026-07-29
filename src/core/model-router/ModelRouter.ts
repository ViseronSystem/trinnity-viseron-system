export class ModelRouter {

    select(task:string){

        if(task.toLowerCase().includes("codigo")){
            return "claude";
        }

        if(task.toLowerCase().includes("local")){
            return "ollama";
        }

        if(task.toLowerCase().includes("investigar")){
            return "gemini";
        }

        return "openai";
    }


    execute(task:string){

        const model=this.select(task);

        console.log(
            "Modelo seleccionado:",
            model
        );

        return model;
    }

}
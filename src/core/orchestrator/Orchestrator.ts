export class TVSOrchestrator {

    agents:any[]=[];

    register(agent:any){
        this.agents.push(agent);
        console.log("Agente registrado:",agent.name);
    }


    async execute(task:string){

        console.log("TVS procesando:",task);

        for(const agent of this.agents){

            if(agent.execute){
                await agent.execute(task);
            }

        }

    }

}

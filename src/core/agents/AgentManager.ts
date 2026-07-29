export interface Agent {

    name:string;

    role:string;

    execute(task:string):string;

}



export class AgentManager {


    private agents:Agent[]=[];



    register(agent:Agent){

        this.agents.push(agent);

        console.log(
            `Agente registrado: ${agent.name}`
        );

    }



    list(){

        return this.agents;

    }



    run(agentName:string, task:string){


        const agent=this.agents.find(
            a=>a.name===agentName
        );


        if(!agent){

            throw new Error(
                "Agente no encontrado"
            );

        }


        return agent.execute(task);

    }


}
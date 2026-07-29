export class AgentManager {


agents=[];


add(agent:any){

this.agents.push(agent);

}


list(){

return this.agents;

}


}

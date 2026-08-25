export class AgentFactory {


create(id:number,name:string,squad:string){

return {

id,
name,
squad,

execute(task:string){

console.log(
name,
"executing",
task
);

}

};

}


}


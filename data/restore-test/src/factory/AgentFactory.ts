
export class AgentFactory {


static create(
id:number,
name:string,
squad:string
){

return {

id,
name,
squad,


run(task:string){

console.log(
"[AGENT]",
name,
"->",
task
)

}

}

}


}



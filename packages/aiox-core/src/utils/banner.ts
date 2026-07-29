/**
 * AIOX-Core Banner
 */
export function printBanner(): void {
  const reset  = "\x1b[0m";
  const cyan   = "\x1b[96m";
  const purple = "\x1b[95m";
  const green  = "\x1b[92m";
  const bold   = "\x1b[1m";
  const dim    = "\x1b[2m";

  console.log("");
  console.log(`${bold}${cyan} █████╗ ██╗ ██████╗ ██╗  ██╗${reset}`);
  console.log(`${bold}${cyan}██╔══██╗██║██╔═══██╗╚██╗██╔╝${reset}`);
  console.log(`${bold}${cyan}███████║██║██║   ██║ ╚███╔╝ ${reset}`);
  console.log(`${bold}${purple}██╔══██║██║██║   ██║ ██╔██╗ ${reset}`);
  console.log(`${bold}${purple}██║  ██║██║╚██████╔╝██╔╝ ██╗${reset}`);
  console.log(`${bold}${purple}╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝${reset}`);
  console.log("");
  console.log(`${bold}  AIOX-Core CLI${reset}  ${dim}v1.0.0${reset}  ${green}● Trinnity Viseron System Hyper-Brain${reset}`);
  console.log(`${dim}  Multi-Agent AI Platform | Pedro & Trinnity | 50Y AIOX Knowledge${reset}`);
  console.log("");
}

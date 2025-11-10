import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHEJanken = await deploy("FHERockPaperSissors", {
    from: deployer,
    log: true,
  });

  console.log(`FHERockPaperSissors contract: `, deployedFHEJanken.address);
};
export default func;
func.id = "deploy_fheRockPaperSissors"; // id required to prevent reexecution
func.tags = ["FHERockPaperSissors"];

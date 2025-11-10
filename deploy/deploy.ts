import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHEJanken = await deploy("FHEJanken", {
    from: deployer,
    log: true,
  });

  console.log(`FHEJanken contract: `, deployedFHEJanken.address);
};
export default func;
func.id = "deploy_fheJanken"; // id required to prevent reexecution
func.tags = ["FHEJanken"];

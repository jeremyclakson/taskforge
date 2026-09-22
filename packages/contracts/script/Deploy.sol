// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AgentTaskEscrow} from "../contracts/AgentTaskEscrow.sol";
import {AgentTaskToken} from "../contracts/AgentTaskToken.sol";

contract DeployScript is Script {
    function run() external {
        address escrowAdmin = vm.envAddress("ESCROW_ADMIN");
        address platformFeeRecipient = vm.envAddress("PLATFORM_FEE_RECIPIENT");
        string memory privateKey = vm.envString("PRIVATE_KEY");

        vm.startBroadcast(privateKey);

        // Deploy Token
        AgentTaskToken token = new AgentTaskToken();
        console.log("AgentTaskToken deployed:", address(token));

        // Deploy Escrow
        AgentTaskEscrow escrow = new AgentTaskEscrow(
            escrowAdmin,
            platformFeeRecipient
        );
        console.log("AgentTaskEscrow deployed:", address(escrow));

        vm.stopBroadcast();

        console.log("Escrow fee bps:", escrow.platformFeeBps());
        console.log("Token name:", token.name());
        console.log("Token supply:", token.totalSupply());
    }
}

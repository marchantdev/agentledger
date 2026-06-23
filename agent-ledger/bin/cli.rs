use agent_ledger::decision_registry::DecisionRegistry;
use odra::host::{HostEnv, NoArgs};
use odra_cli::{
    deploy::DeployScript,
    DeployedContractsContainer, DeployerExt,
    OdraCli,
};

/// Deploys the DecisionRegistry contract.
pub struct RegistryDeployScript;

impl DeployScript for RegistryDeployScript {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer,
    ) -> Result<(), odra_cli::deploy::Error> {
        let _registry = DecisionRegistry::load_or_deploy(
            env,
            NoArgs,
            container,
            350_000_000_000,
        )?;
        Ok(())
    }
}

pub fn main() {
    OdraCli::new()
        .about("CLI tool for AgentLedger DecisionRegistry")
        .deploy(RegistryDeployScript)
        .contract::<DecisionRegistry>()
        .build()
        .run();
}

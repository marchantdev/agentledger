use odra::prelude::*;

/// A single agent decision record stored on-chain.
/// Each record is an immutable receipt: what the agent did, with what inputs/outputs,
/// and optionally which payment/job triggered the action.
#[odra::odra_type]
pub struct DecisionRecord {
    pub agent_id: String,
    pub action_class: String,
    pub input_hash: String,
    pub output_hash: String,
    pub job_payment_ref_hash: String,
    pub decision_id: u64,
}

/// On-chain registry of AI agent decisions.
/// Every call to record_decision creates an immutable, auditable entry.
#[odra::module]
pub struct DecisionRegistry {
    total_decisions: Var<u64>,
    decisions: Mapping<u64, DecisionRecord>,
    agent_counts: Mapping<String, u64>,
}

#[odra::module]
impl DecisionRegistry {
    /// Initialize the registry with zero decisions.
    pub fn init(&mut self) {
        self.total_decisions.set(0u64);
    }

    /// Record a new agent decision on-chain.
    /// Returns the decision_id assigned to this record.
    pub fn record_decision(
        &mut self,
        agent_id: String,
        action_class: String,
        input_hash: String,
        output_hash: String,
        job_payment_ref_hash: String,
    ) -> u64 {
        let id = self.total_decisions.get_or_default();

        let record = DecisionRecord {
            agent_id: agent_id.clone(),
            action_class,
            input_hash,
            output_hash,
            job_payment_ref_hash,
            decision_id: id,
        };

        self.decisions.set(&id, record);

        let count = self.agent_counts.get_or_default(&agent_id);
        self.agent_counts.set(&agent_id, count + 1);

        self.total_decisions.set(id + 1);
        id
    }

    /// Retrieve a decision by its sequential id.
    pub fn get_decision(&self, id: u64) -> DecisionRecord {
        self.decisions
            .get(&id)
            .unwrap_or_revert_with(&self.env(), Error::DecisionNotFound)
    }

    /// Total number of decisions recorded across all agents.
    pub fn get_total_decisions(&self) -> u64 {
        self.total_decisions.get_or_default()
    }

    /// Number of decisions recorded for a specific agent.
    pub fn get_agent_decision_count(&self, agent_id: String) -> u64 {
        self.agent_counts.get_or_default(&agent_id)
    }
}

/// Contract errors.
#[odra::odra_error]
pub enum Error {
    /// The requested decision id does not exist.
    DecisionNotFound = 1,
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn record_and_retrieve() {
        let env = odra_test::env();
        let mut contract = DecisionRegistry::deploy(&env, NoArgs);

        assert_eq!(contract.get_total_decisions(), 0);

        let id = contract.record_decision(
            String::from("agent-alpha"),
            String::from("trade"),
            String::from("abc123"),
            String::from("def456"),
            String::from("job-0x1234"),
        );
        assert_eq!(id, 0);
        assert_eq!(contract.get_total_decisions(), 1);
        assert_eq!(contract.get_agent_decision_count(String::from("agent-alpha")), 1);

        let record = contract.get_decision(0);
        assert_eq!(record.agent_id, "agent-alpha");
        assert_eq!(record.action_class, "trade");
        assert_eq!(record.input_hash, "abc123");
        assert_eq!(record.output_hash, "def456");
        assert_eq!(record.job_payment_ref_hash, "job-0x1234");
        assert_eq!(record.decision_id, 0);
    }

    #[test]
    fn multiple_agents() {
        let env = odra_test::env();
        let mut contract = DecisionRegistry::deploy(&env, NoArgs);

        contract.record_decision(
            String::from("agent-alpha"),
            String::from("trade"),
            String::from("aaa"),
            String::from("bbb"),
            String::from("pay-001"),
        );
        contract.record_decision(
            String::from("agent-beta"),
            String::from("rebalance"),
            String::from("ccc"),
            String::from("ddd"),
            String::from("pay-002"),
        );
        contract.record_decision(
            String::from("agent-alpha"),
            String::from("hedge"),
            String::from("eee"),
            String::from("fff"),
            String::from("pay-003"),
        );

        assert_eq!(contract.get_total_decisions(), 3);
        assert_eq!(contract.get_agent_decision_count(String::from("agent-alpha")), 2);
        assert_eq!(contract.get_agent_decision_count(String::from("agent-beta")), 1);

        let d1 = contract.get_decision(1);
        assert_eq!(d1.agent_id, "agent-beta");
        assert_eq!(d1.action_class, "rebalance");
        assert_eq!(d1.job_payment_ref_hash, "pay-002");
    }
}

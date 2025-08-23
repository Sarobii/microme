CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    scenario TEXT NOT NULL,
    simulation_data JSONB NOT NULL,
    assumptions JSONB NOT NULL,
    risks JSONB NOT NULL,
    ab_test_plan JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
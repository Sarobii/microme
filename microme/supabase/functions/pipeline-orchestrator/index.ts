import { decodeBase64 } from 'jsr:@std/encoding/base64';

const textDecoder = new TextDecoder();

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { 
            posts, 
            uploadSource, 
            goal, 
            scenario,
            runFullPipeline = true 
        } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            console.error('Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
            return new Response(JSON.stringify({
                error: 'Server configuration error. Required environment variables are not set.'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get user from auth header using Supabase JWT verification
        const authHeader = req.headers.get('authorization');
        const apikey = req.headers.get('apikey');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('No authorization header or invalid format');
        }

        const token = authHeader.replace('Bearer ', '');
        
        let userId;
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('JWT must have 3 parts');
            }
            
            const payload = decodeBase64(tokenParts[1]);
            const decodedPayload = JSON.parse(textDecoder.decode(payload));
            userId = decodedPayload.sub || decodedPayload.user_id;
            
            if (!userId) {
                throw new Error('No user ID found in token payload');
            }
            
            console.log('Starting pipeline orchestration for user:', userId);
        } catch (e) {
            console.error('JWT decode error:', e.message);
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const results = {
            ingestion: null,
            persona_analysis: null,
            strategy_planning: null,
            ethics_guard: null,
            simulation: null,
            errors: []
        };

        let pipelineSuccess = true;

        // Step 1: Data Ingestion
        if (posts && Array.isArray(posts) && posts.length > 0) {
            try {
                console.log('Step 1: Running ingestion agent...');
                const ingestionResponse = await fetch(`${supabaseUrl}/functions/v1/ingestion-agent`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json',
                        'apikey': apikey,
                    },
                    body: JSON.stringify({ posts, uploadSource })
                });

                if (ingestionResponse.ok) {
                    results.ingestion = await ingestionResponse.json();
                    console.log('✓ Ingestion completed successfully');
                } else {
                    const errorText = await ingestionResponse.text();
                    results.errors.push(`Ingestion failed: ${errorText}`);
                    pipelineSuccess = false;
                }
            } catch (error) {
                results.errors.push(`Ingestion error: ${error.message}`);
                pipelineSuccess = false;
            }
        }

        // Step 2: Persona Analysis (only if ingestion succeeded or posts already exist)
        if (pipelineSuccess || !posts) {
            try {
                console.log('Step 2: Running persona analyst...');
                const personaResponse = await fetch(`${supabaseUrl}/functions/v1/persona-analyst`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json',
                        'apikey': apikey,
                    },
                    body: JSON.stringify({})
                });

                if (personaResponse.ok) {
                    results.persona_analysis = await personaResponse.json();
                    console.log('✓ Persona analysis completed successfully');
                } else {
                    const errorText = await personaResponse.text();
                    results.errors.push(`Persona analysis failed: ${errorText}`);
                    pipelineSuccess = false;
                }
            } catch (error) {
                results.errors.push(`Persona analysis error: ${error.message}`);
                pipelineSuccess = false;
            }
        }

        // Step 3: Strategy Planning (only if persona analysis succeeded)
        if (pipelineSuccess) {
            try {
                console.log('Step 3: Running strategy planner...');
                const strategyResponse = await fetch(`${supabaseUrl}/functions/v1/strategy-planner`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json',
                        'apikey': apikey,
                    },
                    body: JSON.stringify({ goal: goal || 'lighthearted authority in AI automation' })
                });

                if (strategyResponse.ok) {
                    results.strategy_planning = await strategyResponse.json();
                    console.log('✓ Strategy planning completed successfully');
                } else {
                    const errorText = await strategyResponse.text();
                    results.errors.push(`Strategy planning failed: ${errorText}`);
                    pipelineSuccess = false;
                }
            } catch (error) {
                results.errors.push(`Strategy planning error: ${error.message}`);
                pipelineSuccess = false;
            }
        }

        // Step 4: Ethics Guard (runs regardless of strategy success for transparency)
        try {
            console.log('Step 4: Running ethics guard...');
            const ethicsResponse = await fetch(`${supabaseUrl}/functions/v1/ethics-guard`, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                    'apikey': apikey,
                },
                body: JSON.stringify({})
            });

            if (ethicsResponse.ok) {
                results.ethics_guard = await ethicsResponse.json();
                console.log('✓ Ethics guard completed successfully');
            } else {
                const errorText = await ethicsResponse.text();
                results.errors.push(`Ethics guard failed: ${errorText}`);
            }
        } catch (error) {
            results.errors.push(`Ethics guard error: ${error.message}`);
        }

        // Step 5: Simulation Agent (only if we have persona data)
        if (results.persona_analysis || !posts) {
            try {
                console.log('Step 5: Running simulation agent...');
                const simulationResponse = await fetch(`${supabaseUrl}/functions/v1/simulation-agent`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json',
                        'apikey': apikey,
                    },
                    body: JSON.stringify({ scenario: scenario || 'What if I post 2 case studies per week?' })
                });

                if (simulationResponse.ok) {
                    results.simulation = await simulationResponse.json();
                    console.log('✓ Simulation completed successfully');
                } else {
                    const errorText = await simulationResponse.text();
                    results.errors.push(`Simulation failed: ${errorText}`);
                }
            } catch (error) {
                results.errors.push(`Simulation error: ${error.message}`);
            }
        }

        // Generate pipeline summary
        const pipelineSummary = {
            status: results.errors.length === 0 ? 'completed' : results.errors.length < 3 ? 'partial' : 'failed',
            steps_completed: [
                results.ingestion ? 'ingestion' : null,
                results.persona_analysis ? 'persona_analysis' : null,
                results.strategy_planning ? 'strategy_planning' : null,
                results.ethics_guard ? 'ethics_guard' : null,
                results.simulation ? 'simulation' : null
            ].filter(Boolean),
            total_steps: 5,
            completion_rate: Math.round(([results.ingestion, results.persona_analysis, results.strategy_planning, results.ethics_guard, results.simulation].filter(Boolean).length / 5) * 100),
            processing_time: new Date().toISOString(),
            errors: results.errors,
            next_actions: [
                results.errors.length > 0 ? 'Review and resolve errors' : 'Review analysis results',
                results.strategy_planning ? 'Implement content strategy recommendations' : 'Generate content strategy',
                results.simulation ? 'Consider A/B testing plan' : 'Run scenario simulation',
                'Review transparency card and privacy settings'
            ]
        };

        console.log(`Pipeline orchestration completed. Status: ${pipelineSummary.status}`);

        const result = {
            data: {
                message: `MicroMe pipeline ${pipelineSummary.status}`,
                summary: pipelineSummary,
                results: {
                    ingestion: results.ingestion?.data,
                    persona_analysis: results.persona_analysis?.data,
                    strategy_planning: results.strategy_planning?.data,
                    ethics_guard: results.ethics_guard?.data,
                    simulation: results.simulation?.data
                },
                recommendations: {
                    immediate: [
                        'Review the transparency card to understand how your data is used',
                        'Examine persona analysis insights for accuracy and completeness',
                        'Evaluate strategy recommendations against your goals'
                    ],
                    next_week: [
                        'Test one or two strategy recommendations with actual posts',
                        'Monitor engagement metrics for early validation',
                        'Adjust privacy settings based on comfort level'
                    ],
                    ongoing: [
                        'Run monthly persona analysis to track changes',
                        'Update strategy based on performance data',
                        'Use simulation agent for testing new content approaches'
                    ]
                }
            }
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Pipeline orchestration error:', error);

        const errorResponse = {
            error: {
                code: 'PIPELINE_ORCHESTRATION_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
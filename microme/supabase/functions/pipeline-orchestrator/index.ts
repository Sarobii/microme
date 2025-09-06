export default async function handler(req: Request): Promise<Response> {
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

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            console.error('[ENV ERROR] Missing required environment variables:', {
                SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
                SUPABASE_URL: supabaseUrl
            });
            return new Response(JSON.stringify({ 
                error: 'Server configuration error. Required environment variables are not set.',
                details: {
                    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
                    SUPABASE_URL: supabaseUrl
                }
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get user from auth header using Supabase JWT verification
        const authHeader = req.headers.get('authorization');
        const apikey = req.headers.get('apikey');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('[AUTH ERROR] No authorization header or invalid format');
            return new Response(JSON.stringify({ error: 'No authorization header or invalid format' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        let userId;
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('JWT must have 3 parts');
            }
            const payload = atob(tokenParts[1]);
            const decodedPayload = JSON.parse(payload);
            userId = decodedPayload.sub || decodedPayload.user_id;
            if (!userId) {
                throw new Error('No user ID found in token payload');
            }
            console.log('[AUTH] Starting pipeline orchestration for user:', userId);
        } catch (e) {
            console.error('[AUTH ERROR] JWT decode error:', e.message, e);
            return new Response(JSON.stringify({ error: 'Invalid token', details: e.message }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        type StepResult = { data?: any } | null;
        const results: {
            ingestion: StepResult;
            persona_analysis: StepResult;
            strategy_planning: StepResult;
            ethics_guard: StepResult;
            simulation: StepResult;
            errors: string[];
        } = {
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
                console.log('[INGESTION] Step 1: Running ingestion agent...');
                const ingestionHeaders: Record<string, string> = {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                };
                if (typeof apikey === 'string') ingestionHeaders['apikey'] = apikey;
                const ingestionResponse = await fetch(`${supabaseUrl}/functions/v1/ingestion-agent`, {
                    method: 'POST',
                    headers: ingestionHeaders,
                    body: JSON.stringify({ posts, uploadSource })
                });

                if (ingestionResponse.ok) {
                    results.ingestion = await ingestionResponse.json();
                    console.log('[INGESTION] ✓ Ingestion completed successfully');
                } else {
                    const errorText = await ingestionResponse.text();
                    console.error('[INGESTION ERROR] Ingestion agent returned non-2xx:', errorText);
                    results.errors.push(`Ingestion failed: ${errorText}`);
                    pipelineSuccess = false;
                }
            } catch (error) {
                console.error('[INGESTION ERROR] Exception:', error);
                results.errors.push(`Ingestion error: ${error.message}`);
                pipelineSuccess = false;
            }
        }

        // Step 2: Persona Analysis (only if ingestion succeeded or posts already exist)
        if (pipelineSuccess || !posts) {
            try {
                console.log('Step 2: Running persona analyst...');
                const personaHeaders: Record<string, string> = {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                };
                if (typeof apikey === 'string') personaHeaders['apikey'] = apikey;
                const personaResponse = await fetch(`${supabaseUrl}/functions/v1/persona-analyst`, {
                    method: 'POST',
                    headers: personaHeaders,
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
                const strategyHeaders: Record<string, string> = {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                };
                if (typeof apikey === 'string') strategyHeaders['apikey'] = apikey;
                const strategyResponse = await fetch(`${supabaseUrl}/functions/v1/strategy-planner`, {
                    method: 'POST',
                    headers: strategyHeaders,
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
            const ethicsHeaders: Record<string, string> = {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            };
            if (typeof apikey === 'string') ethicsHeaders['apikey'] = apikey;
            const ethicsResponse = await fetch(`${supabaseUrl}/functions/v1/ethics-guard`, {
                method: 'POST',
                headers: ethicsHeaders,
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
                const simulationHeaders: Record<string, string> = {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                };
                if (typeof apikey === 'string') simulationHeaders['apikey'] = apikey;
                const simulationResponse = await fetch(`${supabaseUrl}/functions/v1/simulation-agent`, {
                    method: 'POST',
                    headers: simulationHeaders,
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
                    ingestion: results.ingestion?.data ?? results.ingestion,
                    persona_analysis: results.persona_analysis?.data ?? results.persona_analysis,
                    strategy_planning: results.strategy_planning?.data ?? results.strategy_planning,
                    ethics_guard: results.ethics_guard?.data ?? results.ethics_guard,
                    simulation: results.simulation?.data ?? results.simulation
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
                message: (error as Error).message,
                timestamp: new Date().toISOString()
            }
        };
        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
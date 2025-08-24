import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Shield,
  User,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";

const features = [
  {
    name: "Explainable AI Analysis",
    description:
      "Every recommendation comes with evidence snippets and confidence scores. No black box decisions.",
    icon: BarChart3,
  },
  {
    name: "Ethical Transparency",
    description:
      "Full transparency card showing data usage, inference logic, and your privacy controls.",
    icon: Shield,
  },
  {
    name: "Evidence-Based Personas",
    description:
      "Persona analysis backed by specific examples from your content, not generic assumptions.",
    icon: User,
  },
  {
    name: "Strategic Recommendations",
    description:
      "Content strategy tied directly to your patterns, with clear rationale for each suggestion.",
    icon: Target,
  },
  {
    name: "Scenario Simulation",
    description:
      'Test "what-if" scenarios with clear assumptions, risks, and A/B testing plans.',
    icon: TrendingUp,
  },
  {
    name: "Human-Centered Process",
    description:
      "Built-in human review checkpoints. AI assists, humans decide.",
    icon: Upload,
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Explainable AI for
              <span className="text-blue-600"> Content Strategy</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              MicroMe analyzes your LinkedIn content through a transparent
              6-stage AI pipeline. Get evidence-based recommendations with full
              explainability and ethical safeguards.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/auth"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Start Analysis
              </Link>
              <a
                href="#features"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Background gradient */}
        <div
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true"
        >
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-blue-200 to-blue-400 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="py-24 bg-gray-50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">
              Transparency First
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              AI recommendations you can trust and understand
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Every analysis comes with evidence, confidence scores, and clear
              explanations. No mysterious algorithms - just transparent,
              explainable insights.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                      <feature.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pipeline overview */}
      <div className="py-24 bg-white sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              6-Stage AI Pipeline
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Each stage builds on the previous, with full transparency and
              human oversight
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  stage: 1,
                  name: "Data Ingestion",
                  desc: "Process posts with derived features",
                },
                {
                  stage: 2,
                  name: "Persona Analysis",
                  desc: "Topics, tone, cadence & personality",
                },
                {
                  stage: 3,
                  name: "Strategy Planning",
                  desc: "Content recommendations with rationale",
                },
                {
                  stage: 4,
                  name: "Ethics Guard",
                  desc: "Transparency card & privacy controls",
                },
                {
                  stage: 5,
                  name: "Simulation",
                  desc: "What-if scenarios with A/B test plans",
                },
                {
                  stage: 6,
                  name: "Web Interface",
                  desc: "Evidence trails & user controls",
                },
              ].map((item) => (
                <div key={item.stage} className="relative">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                      {item.stage}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready for transparent AI insights?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Upload your LinkedIn data and get explainable recommendations with
              full transparency.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/auth"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

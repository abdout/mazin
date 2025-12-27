'use client';
import { useProject } from "@/provider/project";
import React, { useEffect, useRef } from "react";
import { SHIPMENT_TYPE_LABELS, clearanceStages } from "../constant";
import { ShipmentType } from "../types";

interface IndexProps {
  params: Params | Promise<Params>;
}

interface Params {
  id: string;
}

// Procedure descriptions for each stage
const STAGE_PROCEDURES: Record<string, { description: string; steps: string[] }> = {
  "Documentation": {
    description: "Collection and verification of all required shipping and commercial documents.",
    steps: [
      "Collect original documents from shipper/agent",
      "Verify document authenticity and completeness",
      "Cross-check information across all documents",
      "Ensure HS codes are correctly classified",
      "Verify compliance with import regulations",
      "Archive copies for record keeping"
    ]
  },
  "Pre-Clearance": {
    description: "Preparation activities before customs declaration submission.",
    steps: [
      "Review arrival manifest details",
      "Calculate applicable tariffs and duties",
      "Prepare pre-alert notification",
      "Coordinate with shipping line for release",
      "Arrange terminal/CFS handling",
      "Confirm cargo availability"
    ]
  },
  "Customs Declaration": {
    description: "Submission and processing of customs declaration (SAD).",
    steps: [
      "Prepare Single Administrative Document (SAD)",
      "Submit declaration electronically",
      "Monitor risk assessment channel",
      "Arrange physical inspection if required",
      "Provide additional documentation if requested",
      "Track declaration status until approval"
    ]
  },
  "Payment": {
    description: "Calculation and settlement of all duties, taxes, and fees.",
    steps: [
      "Verify duty calculation accuracy",
      "Calculate VAT and other applicable taxes",
      "Assess port and handling charges",
      "Process payment through approved channels",
      "Collect payment receipts",
      "Reconcile payments against declaration"
    ]
  },
  "Release": {
    description: "Obtaining release authorization and cargo collection.",
    steps: [
      "Obtain customs release order",
      "Coordinate terminal release",
      "Arrange transport for pickup",
      "Complete gate-out formalities",
      "Verify cargo condition at release",
      "Document any discrepancies"
    ]
  },
  "Delivery": {
    description: "Final delivery to client and completion of shipment.",
    steps: [
      "Coordinate delivery schedule with client",
      "Arrange final mile transport",
      "Complete empty container return (if applicable)",
      "Obtain proof of delivery",
      "Collect client sign-off",
      "Close shipment file"
    ]
  },
  "Post-Clearance": {
    description: "Post-clearance audit and compliance activities.",
    steps: [
      "Complete audit trail documentation",
      "Verify compliance with all regulations",
      "Archive all records per retention policy",
      "Process any refunds or adjustments",
      "Prepare post-clearance report",
      "Update client on completion"
    ]
  }
};

const Index: React.FC<IndexProps> = ({ params }) => {
  const unwrappedParams = params instanceof Promise ? React.use(params) : params;
  const id = unwrappedParams.id;

  const { project, fetchProject } = useProject();
  const loadedProjectId = useRef<string | null>(null);

  useEffect(() => {
    if (project && project._id === id && loadedProjectId.current === id) {
      return;
    }

    fetchProject(id);
    loadedProjectId.current = id;
  }, [id, fetchProject, project]);

  // Get selected shipment types from project
  const selectedTypes = (project?.systems || project?.shipmentTypes || []) as ShipmentType[];

  if (selectedTypes.length === 0) {
    return (
      <div className="w-3/4 mx-auto py-8 text-center text-muted-foreground">
        No shipment types selected for this project.
      </div>
    );
  }

  return (
    <div className="w-3/4 mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">CLEARANCE PROCEDURES</h1>
        <p className="text-muted-foreground mt-2">
          Standard Operating Procedures for Custom Clearance
        </p>
      </div>

      {/* Table of Contents */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Contents</h2>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black text-center px-2 py-1 w-12">No.</th>
              <th className="border border-black text-center p-2">Shipment Type</th>
              <th className="border border-black text-center p-2 w-24">Stages</th>
            </tr>
          </thead>
          <tbody>
            {selectedTypes.map((type, index) => {
              const stages = clearanceStages[type]?.items || {};
              return (
                <tr key={index}>
                  <td className="border border-black text-center p-2">{index + 1}</td>
                  <td className="border border-black p-2">
                    {SHIPMENT_TYPE_LABELS[type] || type}
                  </td>
                  <td className="border border-black text-center p-2">
                    {Object.keys(stages).length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Procedure Details for Each Shipment Type */}
      {selectedTypes.map((type, typeIndex) => {
        const typeLabel = SHIPMENT_TYPE_LABELS[type] || type;
        const stages = clearanceStages[type]?.items || {};

        return (
          <div key={typeIndex} className="mb-12 page-break-before">
            <h2 className="text-xl font-bold mb-6 text-center border-b-2 border-black pb-2">
              {typeIndex + 1}. PROCEDURES FOR {typeLabel}
            </h2>

            {Object.entries(stages).map(([stageName, stageData], stageIndex) => {
              const activities = stageData?.activities || [];
              const procedure = STAGE_PROCEDURES[stageName];

              return (
                <div key={stageIndex} className="mb-8">
                  {/* Stage Header */}
                  <div className="bg-gray-100 p-3 border border-black">
                    <h3 className="font-bold">
                      {typeIndex + 1}.{stageIndex + 1} {stageName}
                    </h3>
                    {procedure && (
                      <p className="text-sm text-gray-600 mt-1">{procedure.description}</p>
                    )}
                  </div>

                  {/* Procedure Steps */}
                  {procedure && (
                    <div className="border-x border-black p-4">
                      <h4 className="font-semibold text-sm mb-2">Procedure:</h4>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        {procedure.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Tasks Table */}
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-black p-2 w-12 text-center">No.</th>
                        <th className="border border-black p-2">Task</th>
                        <th className="border border-black p-2 w-24 text-center">Responsible</th>
                        <th className="border border-black p-2 w-24 text-center">Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((task, taskIndex) => (
                        <tr key={taskIndex}>
                          <td className="border border-black p-2 text-center">
                            {stageIndex + 1}.{taskIndex + 1}
                          </td>
                          <td className="border border-black p-2">{task}</td>
                          <td className="border border-black p-2 text-center">
                            Clearance Officer
                          </td>
                          <td className="border border-black p-2 text-center">
                            <span className="inline-block w-4 h-4 border border-gray-400"></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Approval Section */}
      <div className="mt-12 border-t-2 border-black pt-8">
        <h2 className="text-lg font-bold mb-4">APPROVAL</h2>
        <table className="w-full border-collapse border border-black">
          <tbody>
            <tr>
              <td className="border border-black p-4 w-1/3">
                <p className="font-semibold">Prepared By:</p>
                <div className="mt-8 border-t border-gray-400 pt-2">
                  <p className="text-sm">Clearance Officer</p>
                  <p className="text-sm text-gray-500">Date: _______________</p>
                </div>
              </td>
              <td className="border border-black p-4 w-1/3">
                <p className="font-semibold">Reviewed By:</p>
                <div className="mt-8 border-t border-gray-400 pt-2">
                  <p className="text-sm">Operations Manager</p>
                  <p className="text-sm text-gray-500">Date: _______________</p>
                </div>
              </td>
              <td className="border border-black p-4 w-1/3">
                <p className="font-semibold">Approved By:</p>
                <div className="mt-8 border-t border-gray-400 pt-2">
                  <p className="text-sm">General Manager</p>
                  <p className="text-sm text-gray-500">Date: _______________</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Index;

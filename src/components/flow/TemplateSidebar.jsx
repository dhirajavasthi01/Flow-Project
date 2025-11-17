import React, { useState } from "react";
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

import { useTemplateManager } from "./hooks/useTemplateManager/useTemplateManager";

 

const TemplateSidebar = () => {

  const { templates, deleteTemplate } = useTemplateManager();

  const [draggedTemplate, setDraggedTemplate] = useState(null);

  const [isCollapsible, setIsCollapsible] = useState(true)

  const handleDragStart = (event, template) => {

    setDraggedTemplate(template);

    event.dataTransfer.effectAllowed = "copy";

    event.dataTransfer.setData(

      "application/template",

      JSON.stringify({

        type: "template",

        templateId: template.id,

        templateName: template.name,

      })

    );

    event.dataTransfer.setData("text/plain", `TEMPLATE:${template.id}`);

  };

 

  const handleDragEnd = () => {

    setDraggedTemplate(null);

  };

 

  const handleDeleteTemplate = (templateId, templateName) => {

    const confirmed = window.confirm(

      `Are you sure you want to delete the template "${templateName}"?\n\nThis will not affect any nodes already placed in the diagram.`

    );

    if (confirmed) deleteTemplate(templateId);

  };

 

  const formatDate = (createdAt) => {

    const date = new Date(createdAt);

    return date.toLocaleDateString("en-US", {

      month: "short",

      day: "numeric",

      hour: "2-digit",

      minute: "2-digit",

    });

  };

 

  const getIcon = (isCollapsible) => {

    return isCollapsible ? <RemoveIcon /> : <AddIcon />;

  };

 

  return (

    <div>

      <div className='flex justify-between items-center bg-primary_blue_bg p-[1vmin_1.5vmin]'>

        <h3 className="text-16 font-weight-600 text-primary_dark_blue uppercase ">

          Template List

        </h3>

        <button

          onClick={() => setIsCollapsible(!isCollapsible)}

          className="border border-outline_primary_blue  bg-transparent rounded-full "      >

          <span

            id="automated-testing-plant-+icon"

            data-testid="collapsible-icon"

            className="d-block"

            style={{

              width: '3vmin',

              height: '3vmin',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center'

            }}

          >

            {getIcon(isCollapsible)}

          </span>

        </button>

      </div>

      {isCollapsible && <div>

        {templates.length === 0 ? (

          <div className="text-center p-[2vmin_1.5vmin] text-gray-500">

            <p className="text-17 leading-relaxed">

              No saved templates yet.

 

              Select nodes and edges, then click

              <span className="font-medium text-primary_dark_blue">

                {" "}

                "Save as Template"

              </span>{" "}

              to create your first template.

            </p>

          </div>

        ) : (

          <div className="flex flex-col gap-2">

            {templates.map((template) => (

              <div

                key={template.id}

                className={`relative group bg-white border border-gray-300 rounded-md p-3 cursor-grab transition-all duration-200 shadow-sm hover:border-[#009FDF] hover:shadow-md hover:-translate-y-[1px] ${draggedTemplate?.id === template.id

                  ? "opacity-70 rotate-2 shadow-lg"

                  : ""

                  }`}

                draggable

                onDragStart={(event) => handleDragStart(event, template)}

                onDragEnd={handleDragEnd}

                title={`Drag to canvas to create a copy of "${template.name}"`}

              >

                {/* Template Content */}

                <div className="flex flex-col gap-2">

                  {/* Header */}

                  <div className="flex justify-between items-center gap-2">

                    <span className="text-xs font-semibold text-gray-800 leading-tight flex-1 break-words">

                      {template.name}

                    </span>

 

                    <button

                      onClick={(e) => {

                        e.stopPropagation();

                        handleDeleteTemplate(template.id, template.name);

                      }}

                      title={`Delete template "${template.name}"`}

                      aria-label={`Delete template "${template.name}"`}

                      className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 font-bold text-xs leading-none transition-colors"

                    >

                      ×

                    </button>

                  </div>

 

                  {/* Info */}

                  <div className="flex justify-between items-center text-[0.625rem] text-gray-500 gap-2">

                    <span>

                      {template.nodes.length} node

                      {template.nodes.length !== 1 ? "s" : ""}

                      {template.edges.length > 0 &&

                        `, ${template.edges.length} edge${template.edges.length !== 1 ? "s" : ""

                        }`}

                    </span>

                    <span>{formatDate(template.createdAt)}</span>

                  </div>

                </div>

 

                {/* Drag Indicator */}

                <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">

                  <span className="text-[0.625rem] text-[#009FDF] font-medium [writing-mode:vertical-rl] [text-orientation:mixed]">

                    Drag to canvas

                  </span>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      }

    </div>

  );

};

 

export default TemplateSidebar;

 

 
figma.showUI(__html__);
figma.ui.onmessage = async (msg) => {
	if (msg.type === "create-variants") {
		const selectedNodes = figma.currentPage.selection;
		if (
			selectedNodes.length !== 1 ||
			selectedNodes[0].type !== "COMPONENT_SET"
		) {
			figma.notify("Please select a single component.");
			return;
		}
		const componentSet = selectedNodes[0] as ComponentSetNode;
		const KPI = msg.variants;
    let index = 1;
		for (const KPIName of KPI) {
      console.log("KPIName: ", KPIName);
			const collection = await getCollection(KPIName.name);
			if (!collection) {
				figma.notify(`Collection for variant ${KPIName.name} not found.`);
        index-=1;
				continue;
			}
			var variables = figma.variables.getLocalVariables();
			const filteredVariables = variables.filter(
				(variable) => variable.variableCollectionId === collection.id
			);
			componentSet.children.forEach((component) => {        
        if (component.type === "COMPONENT") {
          const originalName = component.name;
          const kpiNameMatch = originalName.match(/KPIName=([^,]+)/);
          if (kpiNameMatch && kpiNameMatch[1] === "Base") {
            const newVariant = component.clone();
            const updatedName = originalName.replace(
              /KPIName=[^,]+/,
              `KPIName=${KPIName.name}`
            );
            newVariant.name = updatedName;

            const spacing = 100;
            const newX = component.x + (spacing + componentSet.width)*index;
            const newY = component.y;

            // console.log("New X: ", newX);
            // console.log("New Y: ", newY);
            // console.log("index: ", index);  

            newVariant.x = newX;
            newVariant.y = newY;

            componentSet.appendChild(newVariant);

            // Extract Month, Year, and State from the updated name
            const monthMatch = updatedName.match(/Month=([^,]+)/);
            const yearMatch = updatedName.match(/Year=([^,]+)/);
            const stateMatch = updatedName.match(/State=([^,]+)/);

            const month = monthMatch ? monthMatch[1] : null;
            const year = yearMatch ? yearMatch[1] : null;
            const state = stateMatch ? stateMatch[1] : null;

            // console.log(`Month: ${month}, Year: ${year}, State: ${state}`);

            function traverseAndBind(node: SceneNode) {
              // console.log(`Node: ${node.name}, Type: ${node.type}`);
              if ("children" in node) {
                node.children.forEach((child) => {
                  traverseAndBind(child);
                });
              }
              // Check the state in the variant name and bind variables
              if (updatedName.includes("State=Hover")) {
                if (node.type === "RECTANGLE") {
                  const variableName = `${month}/GValue/${year}`;
                  // console.log("Computed Variable Name: ", variableName);
                  const existingVariable = filteredVariables.find(
                    (variable) => variable.name === variableName
                  );
                  if (existingVariable) {
                    node.setBoundVariable("height", existingVariable);
                  }
                }
                if (node.type === "TEXT" && node.name === "MonthLabel") {
                  const variableName = `${month}/MonthLabel/${year}`;
                  // console.log("Computed Variable Name: ", variableName);
                  const existingVariable = filteredVariables.find(
                    (variable) => variable.name === variableName
                  );
                  if (existingVariable) {
                    node.setBoundVariable("characters", existingVariable);
                  }
                }
                if (node.type === "TEXT" && node.name === "Value") {
                  const variableName = `${month}/Value/${year}`;
                  // console.log("Computed Variable Name: ", variableName);
                  const existingVariable = filteredVariables.find(
                    (variable) => variable.name === variableName
                  );
                  if (existingVariable) {
                    node.setBoundVariable("characters", existingVariable);
                  }
                }
              } else if (updatedName.includes("State=Default") && node.type === "RECTANGLE") {
                const variableName = `${month}/GValue/${year}`;
                // console.log("Computed Variable Name: ", variableName);
                const existingVariable = filteredVariables.find(
                  (variable) => variable.name === variableName
                );
                if (existingVariable) {
                  node.setBoundVariable("height", existingVariable);
                }
              }
            }
            traverseAndBind(newVariant);
            // console.log("Completed Cloning of Component:", component.name);
          }
          
        }

			});
      index += 1;
		}

		figma.notify("Variants created successfully!");
		figma.closePlugin();
	}
};

function getCollection(sheetName: string) {
	const collections = figma.variables.getLocalVariableCollections();
	let collection = collections.find((col) => col.name === sheetName);
	if (!collection) {
		console.log(
			`No collection found with the name: ${sheetName}. Creating a new collection.`
		);
	}
	return collection;
}
function getVariableValueByMode(
	collection: VariableCollection,
	existingVariable: Variable,
	modeName: string
) {
	const mode = collection.modes.find((mode) => mode.name === modeName);
	if (mode) {
		return existingVariable.valuesByMode[mode.modeId];
	} else {
		return null;
	}
}


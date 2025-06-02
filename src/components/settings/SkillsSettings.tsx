import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSkillsSettings } from "@/hooks/useSkillsSettings";
import ManageListItems from "./ManageListItems"; // Import the generic component
import { Separator } from "@/components/ui/separator"; // Optional separator

const SkillsSettings = () => {
  const {
    physicalSkills,
    addPhysicalSkill,
    deletePhysicalSkill,
    editPhysicalSkill,
    technicalSkills,
    addTechnicalSkill,
    deleteTechnicalSkill,
    editTechnicalSkill,
  } = useSkillsSettings();

  return (
    <>
      {/* Physical Skills Section */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800">Physical Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <ManageListItems
            items={physicalSkills}
            onAddItem={addPhysicalSkill}
            onDeleteItem={deletePhysicalSkill}
            onEditItem={editPhysicalSkill}
            itemName="Physical Skill"
            itemNounPlural="physical skills"
            inputPlaceholder="Add new physical skill..."
            itemDisplayClass="border-blue-200 text-blue-800 bg-blue-50" // Example custom styling
            allowEditing={true}
          />
        </CardContent>
      </Card>

      {/* Separator can be optional, or use more space if preferred */}
      {/* <Separator className="my-6" />  */}

      {/* Technical Skills Section */}
      <Card className="border-stone-200"> {/* Added mt-6 for spacing if no separator */}
        <CardHeader>
          <CardTitle className="text-stone-800">Technical Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <ManageListItems
            items={technicalSkills}
            onAddItem={addTechnicalSkill}
            onDeleteItem={deleteTechnicalSkill}
            onEditItem={editTechnicalSkill}
            itemName="Technical Skill"
            itemNounPlural="technical skills"
            inputPlaceholder="Add new technical skill..."
            itemDisplayClass="border-green-200 text-green-800 bg-green-50" // Example custom styling
            allowEditing={true}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default SkillsSettings;

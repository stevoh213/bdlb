import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPENROUTER_CONFIG } from "@/config/openrouter";
import { Settings, Eye, EyeOff } from "lucide-react";

interface AISettingsFormProps {
  onSave: (apiKey: string, model: string) => void;
  onCancel: () => void;
}

const AISettingsForm = ({ onSave, onCancel }: AISettingsFormProps) => {
  const [apiKey, setApiKey] = useState(OPENROUTER_CONFIG.defaultApiKey);
  const [selectedModel, setSelectedModel] = useState(
    OPENROUTER_CONFIG.defaultModel,
  );
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const savedApiKey =
      localStorage.getItem("openrouter_api_key") ||
      OPENROUTER_CONFIG.defaultApiKey;
    const savedModel =
      localStorage.getItem("openrouter_model") ||
      OPENROUTER_CONFIG.defaultModel;

    setApiKey(savedApiKey);
    setSelectedModel(savedModel);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    localStorage.setItem("openrouter_api_key", apiKey);
    localStorage.setItem("openrouter_model", selectedModel);
    onSave(apiKey, selectedModel);
  };

  return (
    <Card className="border-stone-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          AI Analysis Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="text-stone-700 font-medium">
              OpenRouter API Key *
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenRouter API key"
                className="pr-10 border-stone-300 focus:border-blue-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Get your API key from{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
          </div>

          <div>
            <Label htmlFor="model" className="text-stone-700 font-medium">
              AI Model
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="border-stone-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPENROUTER_CONFIG.availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-stone-600">
                        {model.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-stone-300 text-stone-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!apiKey.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AISettingsForm;

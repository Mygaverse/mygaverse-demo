export type CharacterConfig = Record<string, string> & { characterName?: string };

interface CharacterBuilderFormProps {
  onChange?: (config: CharacterConfig, prompt: string) => void;
  [key: string]: unknown;
}

export default function CharacterBuilderForm(_props: CharacterBuilderFormProps) {
  return null;
}

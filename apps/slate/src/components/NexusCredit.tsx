import { nexusPlatform } from "../nexus-attribution";

export function NexusCredit() {
  return (
    <p className="hint nexus-credit">
      With thanks to{" "}
      <a href={nexusPlatform.url} target="_blank" rel="noopener noreferrer">
        Nimble Nexus
      </a>{" "}
      and its developer,{" "}
      <a
        href={nexusPlatform.developerUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        byteslicer
      </a>
      .
    </p>
  );
}

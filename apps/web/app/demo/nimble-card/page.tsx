"use client";

import { NimbleCard, NimbleCardBanner, NimbleCardHeader, NimbleCardContent } from "@/components/ui/nimble-card";
import Head from "next/head";

export default function NimbleCardDemo() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700;900&display=swap');
        
        .nimbrew-font {
          font-family: 'Roboto Condensed', sans-serif;
        }
      `}</style>
      <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">NimbleCard Component Demo</h1>
      
      {/* Basic NimbleCard */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Basic NimbleCard</h2>
        <NimbleCard className="max-w-md">
          <NimbleCardHeader>
            <h3 className="text-lg font-bold">Monster Name</h3>
            <span className="text-sm text-muted-foreground ml-2">Level 5 • Medium Undead</span>
            <div className="ml-auto flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold">30</div>
                <div className="text-xs text-muted-foreground">HP</div>
              </div>
              <div className="text-center">
                <div className="font-bold">15</div>
                <div className="text-xs text-muted-foreground">AC</div>
              </div>
              <div className="text-center">
                <div className="font-bold">+5</div>
                <div className="text-xs text-muted-foreground">STR</div>
              </div>
              <div className="text-center">
                <div className="font-bold">30ft</div>
                <div className="text-xs text-muted-foreground">Speed</div>
              </div>
            </div>
          </NimbleCardHeader>
          <NimbleCardContent>
            <div className="text-sm">A fearsome undead creature that haunts the ancient crypts.</div>
          </NimbleCardContent>
        </NimbleCard>
      </section>

      {/* NimbleCard with Banner - Exact Nimbrew Replica */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Nimbrew Statblock Replica</h2>
        <NimbleCard className="nimbrew-font" style={{ width: "400px" }}>
          <NimbleCardHeader>
            <h3 className="text-2xl font-black italic" style={{ 
              fontVariant: "small-caps",
              color: "var(--nimble-text)",
              fontFamily: "'Roboto Condensed', sans-serif",
              whiteSpace: "nowrap"
            }}>Zombie Knight</h3>
            <span className="text-xs opacity-50 inline-block ml-2" style={{ 
              color: "var(--nimble-accent)",
              fontVariant: "small-caps",
              transform: "translateX(6px)"
            }}>CR 1/2</span>
            <div className="flex gap-3 ml-auto text-sm font-bold italic uppercase">
              <div className="flex items-center gap-1">
                <span className="opacity-25">❤️</span>
                <span>30</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="opacity-25">🛡️</span>
                <span>M</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="opacity-25">⭐</span>
                <span>STR+</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="opacity-25">➡️</span>
                <span>10</span>
              </div>
            </div>
          </NimbleCardHeader>
          
          <NimbleCardBanner>
            <div>
              <span className="font-bold">Unliving.</span>
              <span className="ml-1">Half damage from Necrotic and Piercing, double from Radiant.</span>
            </div>
            <div>
              <span className="font-bold">Armor Training.</span>
              <span className="ml-1">The zombie has proficiency with all armor and shields.</span>
            </div>
          </NimbleCardBanner>
          
          <NimbleCardContent>
            <div>
              <span className="font-bold">Stab.</span>
              <span className="ml-1">1d6+2</span>
            </div>
            <div>
              <div>
                <span className="font-bold">ACTIONS:</span>
                <span className="ml-1">after each hero's turn, choose one:</span>
              </div>
              <div className="ml-4">
                <span className="font-bold">Longsword.</span>
                <span className="ml-1">1d8+3 slashing</span>
              </div>
              <div className="ml-4">
                <span className="font-bold">Shield Bash.</span>
                <span className="ml-1">1d4+3 bludgeoning</span>
              </div>
            </div>
          </NimbleCardContent>
        </NimbleCard>
      </section>

      {/* Variant Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NimbleCard variant="default">
            <NimbleCardHeader>
              <h4 className="font-semibold">Default Variant</h4>
            </NimbleCardHeader>
            <NimbleCardContent>
              <p className="text-sm">Full statblock styling with borders and cream background</p>
            </NimbleCardContent>
          </NimbleCard>
          
          <NimbleCard variant="accent">
            <NimbleCardHeader>
              <h4 className="font-semibold">Accent Variant</h4>
            </NimbleCardHeader>
            <NimbleCardContent>
              <p className="text-sm">Uses primary theme color for borders</p>
            </NimbleCardContent>
          </NimbleCard>
          
          <NimbleCard variant="muted">
            <NimbleCardHeader>
              <h4 className="font-semibold">Muted Variant</h4>
            </NimbleCardHeader>
            <NimbleCardContent>
              <p className="text-sm">No borders, uses passive background color (#d8d2c2)</p>
            </NimbleCardContent>
          </NimbleCard>
        </div>
      </section>

      {/* Simple Variant */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Simple Variant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NimbleCard variant="simple">
            <h4 className="font-semibold mb-2">Simple Border</h4>
            <p className="text-sm">
              A simplified version without the complex corner borders.
              Uses standard border-radius for a cleaner, modern look.
            </p>
          </NimbleCard>
          
          <NimbleCard variant="simple" className="nimble-card-accent">
            <h4 className="font-semibold mb-2">Simple Accent</h4>
            <p className="text-sm">
              Simple variant with accent color.
              Combines simplicity with visual emphasis.
            </p>
          </NimbleCard>
        </div>
      </section>
      
      {/* Comparison of All Variants */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Variant Comparison</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Default</h3>
              <NimbleCard variant="default" style={{ width: "200px" }}>
                <NimbleCardHeader>
                  <span className="font-bold">Monster</span>
                </NimbleCardHeader>
                <NimbleCardBanner>
                  <div className="text-xs">Passive ability</div>
                </NimbleCardBanner>
                <NimbleCardContent>
                  <div className="text-xs">Attack: 1d6</div>
                </NimbleCardContent>
              </NimbleCard>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Accent</h3>
              <NimbleCard variant="accent" style={{ width: "200px" }}>
                <NimbleCardHeader>
                  <span className="font-bold">Monster</span>
                </NimbleCardHeader>
                <NimbleCardBanner>
                  <div className="text-xs">Passive ability</div>
                </NimbleCardBanner>
                <NimbleCardContent>
                  <div className="text-xs">Attack: 1d6</div>
                </NimbleCardContent>
              </NimbleCard>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Muted</h3>
              <NimbleCard variant="muted" style={{ width: "200px" }}>
                <NimbleCardHeader>
                  <span className="font-bold">Monster</span>
                </NimbleCardHeader>
                <NimbleCardBanner>
                  <div className="text-xs">Passive ability</div>
                </NimbleCardBanner>
                <NimbleCardContent>
                  <div className="text-xs">Attack: 1d6</div>
                </NimbleCardContent>
              </NimbleCard>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Simple</h3>
              <NimbleCard variant="simple" style={{ width: "200px" }}>
                <div className="p-4">
                  <div className="font-bold mb-2">Monster</div>
                  <div className="text-xs mb-2 p-2 bg-gray-100 rounded">Passive ability</div>
                  <div className="text-xs">Attack: 1d6</div>
                </div>
              </NimbleCard>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
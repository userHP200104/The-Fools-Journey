const { useState, useEffect } = React;

// Emoji mappings for suits and major arcana
const suitEmojis = {
  Cups: "🏺",
  Batons: "🪄",
  Swords: "⚔️",
  Coins: "🪙"
};

const majorArcanaEmojis = {
  "Death": "💀",
  "The Magician": "✨",
  "The Empress": "👸",
  "The Emperor": "🤴",
  "The Chariot": "🚗"
};

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

const buildDeck = () => {
  let deck = [];
  const suits = ["Cups", "Batons", "Swords", "Coins"];
  for (let suit of suits) {
    for (let num = 2; num <= 10; num++) {
      deck.push({
        id: `${suit}-${num}-${Math.random().toString(36).substr(2, 6)}`,
        type: "minor",
        suit,
        value: num,
        display: `${num} ${suit[0]}`
      });
    }
  }
  const majorArcana = [
    { name: "Death", value: 13 },
    { name: "The Magician", value: 1 },
    { name: "The Empress", value: 3 },
    { name: "The Emperor", value: 4 },
    { name: "The Chariot", value: 6 }
  ];
  for (let card of majorArcana) {
    deck.push({
      id: `Trump-${card.name}-${Math.random().toString(36).substr(2, 6)}`,
      type: "major",
      suit: "Trump",
      value: card.value,
      display: card.name
    });
  }
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const Card = ({ card, onClick, isSelected }) => {
  let emoji = "";
  if (card.type === "major") {
    emoji = majorArcanaEmojis[card.display] || "⭐";
  } else {
    emoji = suitEmojis[card.suit] || "🃏";
  }
  return (
    <div
      className={`card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex="0"
      aria-label={`Card: ${card.display}`}
      onKeyPress={(e) => {
        if (e.key === "Enter") onClick();
      }}
    >
      <div>{card.display}</div>
      <div style={{ fontSize: "14px" }}>{emoji}</div>
    </div>
  );
};

const Game = () => {
  const [deck, setDeck] = useState([]);
  const [adventureField, setAdventureField] = useState([]);
  const [satchel, setSatchel] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [equipment, setEquipment] = useState({
    wisdom: [],
    strength: null,
    volition: null
  });
  const [vitality, setVitality] = useState(25);
  const [selected, setSelected] = useState({
    zone: null,
    index: null,
    card: null
  });
  const [playLog, setPlayLog] = useState([]);

  // Modal state variables
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);

  const addLog = (msg) => {
    setPlayLog((prev) => [msg, ...prev]);
  };

  const dealAdventure = (numCards, deckToUse = deck) => {
    let newDeck = [...deckToUse];
    let newCards = [];
    for (let i = 0; i < numCards; i++) {
      if (newDeck.length > 0) {
        newCards.push(newDeck.shift());
      }
    }
    setAdventureField((prev) => [...prev, ...newCards]);
    setDeck(newDeck);
    addLog(`Dealt ${newCards.length} card(s) to the Adventure Field.`);
  };

  const resetGame = () => {
    const newDeck = buildDeck();
    const dealtCards = newDeck.slice(0, 4);
    const remainingDeck = newDeck.slice(4);
    setDeck(remainingDeck);
    setAdventureField(dealtCards);
    setSatchel([]);
    setDiscardPile([]);
    setEquipment({ wisdom: [], strength: null, volition: null });
    setVitality(25);
    setSelected({ zone: null, index: null, card: null });
    setPlayLog([]);
    addLog("Game reset. Vitality is 25.");
  };

  useEffect(() => {
    const newDeck = buildDeck();
    const dealtCards = newDeck.slice(0, 4);
    const remainingDeck = newDeck.slice(4);
    setDeck(remainingDeck);
    setAdventureField(dealtCards);
    addLog("Game started. Vitality is 25.");
  }, []);

  // Update status and log displays
  useEffect(() => {
    const statusText = `Vitality: ${vitality}
Wisdom: ${equipment.wisdom.map((c) => c.display).join(", ") || "None"}
Strength: ${equipment.strength ? equipment.strength.display : "None"}
Volition: ${equipment.volition ? equipment.volition.display : "None"}
Satchel: ${satchel.map((c) => c.display).join(", ") || "Empty"}
Deck: ${deck.length} card(s)`;
    document.getElementById("statusDisplay").innerText = statusText;
    document.getElementById("logDisplay").innerHTML = playLog
      .map((msg) => `<div>${msg}</div>`)
      .join("");
  }, [vitality, equipment, satchel, deck, playLog]);

  const removeCard = (zone, index) => {
    if (zone === "adventure") {
      const newField = deepCopy(adventureField);
      newField.splice(index, 1);
      setAdventureField(newField);
    } else if (zone === "satchel") {
      const newSatchel = deepCopy(satchel);
      newSatchel.splice(index, 1);
      setSatchel(newSatchel);
    }
  };

  const clearSelection = () => {
    setSelected({ zone: null, index: null, card: null });
  };

  const selectCard = (zone, index, card) => {
    setSelected({ zone, index, card });
    addLog(`Selected ${card.display} from ${zone}.`);
  };

  const storeInSatchel = () => {
    if (selected.zone === "adventure" && satchel.length < 3) {
      setSatchel((prev) => [...prev, selected.card]);
      removeCard("adventure", selected.index);
      addLog(`Stored ${selected.card.display} in Satchel.`);
      clearSelection();
    }
  };

  const equipCard = () => {
    const card = selected.card;
    if (card.type !== "minor") return;
    if (card.suit === "Coins" && equipment.wisdom.length < 3) {
      setEquipment((prev) => ({
        ...prev,
        wisdom: [...prev.wisdom, card]
      }));
      removeCard(selected.zone, selected.index);
      addLog(`Equipped ${card.display} as Wisdom.`);
      clearSelection();
    } else if (card.suit === "Batons" && !equipment.strength) {
      setEquipment((prev) => ({ ...prev, strength: card }));
      removeCard(selected.zone, selected.index);
      addLog(`Equipped ${card.display} as Strength.`);
      clearSelection();
    } else if (card.suit === "Swords" && !equipment.volition) {
      setEquipment((prev) => ({ ...prev, volition: card }));
      removeCard(selected.zone, selected.index);
      addLog(`Equipped ${card.display} as Volition.`);
      clearSelection();
    }
  };

  const replenishVitality = () => {
    const card = selected.card;
    if (card.type === "minor" && card.suit === "Cups") {
      const gain = card.value;
      const newVitality = Math.min(25, vitality + gain);
      setVitality(newVitality);
      removeCard(selected.zone, selected.index);
      addLog(
        `Used ${card.display} to replenish vitality by ${gain}. New Vitality: ${newVitality}.`
      );
      clearSelection();
    }
  };

  const discardCard = () => {
    removeCard(selected.zone, selected.index);
    setDiscardPile((prev) => [...prev, selected.card]);
    addLog(`Discarded ${selected.card.display}.`);
    clearSelection();
  };

  const resolveWithVolition = () => {
    const challenge = selected.card;
    if (challenge.type !== "major" || !equipment.volition) return;
    if (equipment.volition.value >= challenge.value) {
      addLog(
        `Volition ${equipment.volition.display} overcame challenge ${challenge.display}.`
      );
      setEquipment((prev) => ({ ...prev, volition: null }));
      removeCard("adventure", selected.index);
      setDiscardPile((prev) => [...prev, challenge]);
    } else {
      addLog(
        `Volition ${equipment.volition.display} partially reduced challenge ${challenge.display}.`
      );
      challenge.value = challenge.value - equipment.volition.value;
      setEquipment((prev) => ({ ...prev, volition: null }));
      setAdventureField(deepCopy(adventureField));
    }
    clearSelection();
  };

  const resolveWithStrength = () => {
    const challenge = selected.card;
    if (challenge.type !== "major" || !equipment.strength) return;
    if (equipment.strength.value >= challenge.value) {
      if (equipment.strength.value === challenge.value) {
        addLog(
          `Strength ${equipment.strength.display} exactly resolved challenge ${challenge.display}.`
        );
        setEquipment((prev) => ({ ...prev, strength: null }));
      } else {
        const remaining = equipment.strength.value - challenge.value;
        addLog(
          `Strength ${equipment.strength.display} resolved challenge ${challenge.display}. Remaining Strength: ${remaining}.`
        );
        setEquipment((prev) => ({
          ...prev,
          strength: {
            ...equipment.strength,
            value: remaining,
            display: `${remaining} B`
          }
        }));
      }
      removeCard("adventure", selected.index);
      setDiscardPile((prev) => [...prev, challenge]);
    } else {
      const diff = challenge.value - equipment.strength.value;
      addLog(
        `Strength ${equipment.strength.display} insufficient; Vitality reduced by ${diff}.`
      );
      setVitality((prev) => Math.max(0, prev - diff));
      setEquipment((prev) => ({ ...prev, strength: null }));
      removeCard("adventure", selected.index);
      setDiscardPile((prev) => [...prev, challenge]);
    }
    clearSelection();
  };

  const resolveDirectly = () => {
    const challenge = selected.card;
    if (challenge.type !== "major") return;
    addLog(
      `Directly resolved challenge ${challenge.display} – Vitality reduced by ${challenge.value}.`
    );
    setVitality((prev) => Math.max(0, prev - challenge.value));
    removeCard("adventure", selected.index);
    setDiscardPile((prev) => [...prev, challenge]);
    clearSelection();
  };

  useEffect(() => {
    if (adventureField.length < 2 && deck.length > 0) {
      const needed = 4 - adventureField.length;
      dealAdventure(needed);
    }
    if (vitality <= 0) {
      addLog("Game Over! Vitality depleted.");
    }
  }, [adventureField, deck, vitality]);

  const getActions = () => {
    if (!selected.card) return [];
    const card = selected.card;
    const actions = [];
    if (card.type === "minor") {
      if (card.suit === "Cups" && vitality < 25) {
        actions.push({
          label: "Replenish Vitality",
          handler: replenishVitality
        });
      }
      if (card.suit === "Batons" && !equipment.strength) {
        actions.push({
          label: "Equip as Strength",
          handler: equipCard
        });
      }
      if (card.suit === "Swords" && !equipment.volition) {
        actions.push({
          label: "Equip as Volition",
          handler: equipCard
        });
      }
      if (card.suit === "Coins" && equipment.wisdom.length < 3) {
        actions.push({
          label: "Equip as Wisdom",
          handler: equipCard
        });
      }
      if (selected.zone === "adventure" && satchel.length < 3) {
        actions.push({
          label: "Store in Satchel",
          handler: storeInSatchel
        });
      }
      actions.push({ label: "Discard", handler: discardCard });
    } else if (card.type === "major") {
      if (equipment.volition) {
        actions.push({
          label: "Resolve with Volition",
          handler: resolveWithVolition
        });
      }
      if (equipment.strength) {
        actions.push({
          label: "Resolve with Strength",
          handler: resolveWithStrength
        });
      }
      actions.push({ label: "Resolve Directly", handler: resolveDirectly });
    }
    return actions;
  };

  // Attach click handlers for the modal buttons
  useEffect(() => {
    const instructionsButton = document.getElementById("instructionsButton");
    const deckButton = document.getElementById("deckButton");
    const instructionsHandler = () => setShowInstructionsModal(true);
    const deckHandler = () => setShowDeckModal(true);
    instructionsButton.addEventListener("click", instructionsHandler);
    deckButton.addEventListener("click", deckHandler);
    return () => {
      instructionsButton.removeEventListener("click", instructionsHandler);
      deckButton.removeEventListener("click", deckHandler);
    };
  }, []);

  return (
    <div>
      <div className="zone">
        <div className="zone-title">Adventure Field</div>
        <div className="cards-container" role="region" aria-label="Adventure Field">
          {adventureField.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              isSelected={selected.zone === "adventure" && selected.index === index}
              onClick={() => selectCard("adventure", index, card)}
            />
          ))}
        </div>
      </div>
      <div className="zone">
        <div className="zone-title">Satchel</div>
        <div className="cards-container" role="region" aria-label="Satchel">
          {satchel.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              isSelected={selected.zone === "satchel" && selected.index === index}
              onClick={() => selectCard("satchel", index, card)}
            />
          ))}
        </div>
      </div>
      <div className="zone">
        <div className="zone-title">Equipped</div>
        <div className="cards-container" role="region" aria-label="Equipment">
          {equipment.wisdom.map((card, index) => (
            <Card key={card.id} card={card} isSelected={false} onClick={() => {}} />
          ))}
          {equipment.strength && (
            <Card card={equipment.strength} isSelected={false} onClick={() => {}} />
          )}
          {equipment.volition && (
            <Card card={equipment.volition} isSelected={false} onClick={() => {}} />
          )}
        </div>
      </div>
      {selected.card && (
        <div className="zone">
          <div className="zone-title">Actions for {selected.card.display}</div>
          <div className="card-stats">
            <p>Type: {selected.card.type}</p>
            <p>Suit: {selected.card.suit}</p>
            <p>Value: {selected.card.value}</p>
          </div>
          {getActions().map((action, idx) => (
            <button key={idx} onClick={action.handler}>
              {action.label}
            </button>
          ))}
          <button onClick={clearSelection}>Cancel Selection</button>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) {
              setShowInstructionsModal(false);
            }
          }}
        >
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowInstructionsModal(false)}>
              X
            </button>
            <h2>Instructions</h2>
            <p>
              Welcome to <strong>The Fool's Journey</strong> card game!
              <br />
              Click on any card in the Adventure Field, Satchel, or Equipped zone to see available actions.
              <br />
              <strong>Minor Arcana</strong> cards:
            </p>
            <ul>
              <li><strong>Cups</strong>: Replenish vitality (max 25).</li>
              <li><strong>Batons</strong>: Equip as Strength (only 1 allowed).</li>
              <li><strong>Swords</strong>: Equip as Volition (only 1 allowed).</li>
              <li><strong>Coins</strong>: Equip as Wisdom (up to 3 allowed).</li>
            </ul>
            <p>
              <strong>Major Arcana</strong> cards: Resolve challenges using equipped cards or directly (vitality loss).
            </p>
          </div>
        </div>
      )}

      {/* Deck Modal */}
      {showDeckModal && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) {
              setShowDeckModal(false);
            }
          }}
        >
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowDeckModal(false)}>
              X
            </button>
            <h2>Deck</h2>
            <div className="cards-container">
              {deck.map((card) => (
                <Card key={card.id} card={card} isSelected={false} onClick={() => {}} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => <Game />;

ReactDOM.render(<App />, document.getElementById("root"));

// For demo purposes, these buttons reload the page
document.getElementById("dealNewAdventure").addEventListener("click", () => {
  window.location.reload();
});
document.getElementById("resetGame").addEventListener("click", () => {
  window.location.reload();
});

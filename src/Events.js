const canvas = document.getElementById("Main-Canvas");
// canvas.addEventListener('contextmenu', (event) => {
//     event.preventDefault(); // Disable the right-click menu
// });

class Input {
  constructor() {
    this.m_Value = false;
    this.m_Checked = false;
  }
}

class EventManager {
  constructor() {
    if (EventManager.instance) {
      return EventManager.instance;
    }

    this.#OnKeyDown = this.#OnKeyDown.bind(this);
    document.addEventListener("keydown", this.#OnKeyDown);
    document.addEventListener("keyup", this.#OnKeyUp);
    document.addEventListener("mousedown", this.#OnMouseDown);
    document.addEventListener("mouseup", this.#OnMouseUp);

    this.m_AlphaNumericKeys = Array.from({ length: 63 }, () => new Input());
    this.m_SpecialKeys = Array.from({ length: 10 }, () => new Input());
    this.m_MouseButtons = Array.from({ length: 10 }, () => new Input());

    EventManager.instance = this;
  }

  IsKeyPressed(key) {
    var index = this.#GetKeyIndex(key);
    var result;

    if (index == -1) {
      return false;
    }

    if (key.length == 1) {
      // alphanumeric key
      result =
        this.m_AlphaNumericKeys[index].m_Value &&
        !this.m_AlphaNumericKeys[index].m_Checked;
      if (result) {
        this.m_AlphaNumericKeys[index].m_Checked = true;
      }
      return result;
    }

    // a special key
    result =
      this.m_SpecialKeys[index].m_Value && !this.m_SpecialKeys[index].m_Checked;
    if (result) this.m_SpecialKeys[index].m_Checked = true;
    return result;
  }

  IsKeyHeld(key) {
    // Does not work with any key. Only a specific key.
    var index = this.#GetKeyIndex(key);

    if (index == -1) {
      return false;
    }

    if (key.length == 1) {
      // alphanumeric key
      return this.m_AlphaNumericKeys[index].m_Value;
    }

    // else a special key
    return this.m_SpecialKeys[index].m_Value;
  }

  IsKeyReleased(key) {
    return !this.IsKeyHeld(key);
  }

  IsMouseButtonPressed(button) {
    if (button < 0 || button > MOUSE.ANY) {
      return false;
    }

    var result =
      this.m_MouseButtons[button].m_Value &&
      !this.m_MouseButtons[button].m_Checked;
    if (result) this.m_MouseButtons[button].m_Checked = true;
    return result;
  }

  IsMouseButtonHeld(button) {
    if (button < 0 || button > MOUSE.ANY) {
      return false;
    }
    return this.m_MouseButtons[button].m_Value;
  }

  IsMouseButtonReleased(button) {
    return !this.IsMouseButtonHeld(button);
  }

  ClearInputs() {
    // Reset all key and mouse inputs in array
  }

  // private methods. Why are you going further?
  #OnKeyDown = (event) => {
    var index = this.#GetKeyIndex(event.key);
    if (index == -1) {
      return;
    }
    this.m_SpecialKeys[0].m_Value = true; // set any to be true

    if (event.key.length == 1) {
      // alphanumeric key
      this.m_AlphaNumericKeys[index].m_Value = true;
      return;
    }

    // else a special key
    this.m_SpecialKeys[index].m_Value = true;
  };

  #OnKeyUp = (event) => {
    var index = this.#GetKeyIndex(event.key);

    if (index == -1) {
      return;
    }
    this.m_SpecialKeys[0].m_Value = false; // set any to be false
    this.m_SpecialKeys[0].m_Checked = false;

    if (event.key.length == 1) {
      // alphanumeric key
      this.m_AlphaNumericKeys[index].m_Value = false;
      this.m_AlphaNumericKeys[index].m_Checked = false;
      return;
    }

    // else a special key
    this.m_SpecialKeys[index].m_Value = false;
    this.m_SpecialKeys[index].m_Checked = false;
  };

  #OnMouseDown = (event) => {
    if (event.button < 0 || event.button >= MOUSE.ANY) {
      return;
    }

    canvas.requestPointerLock();
    event.preventDefault();

    this.m_MouseButtons[MOUSE.ANY].m_Value = true;
    this.m_MouseButtons[event.button].m_Value = true;
  };

  #OnMouseUp = (event) => {
    if (event.button < 0 || event.button >= MOUSE.ANY) {
      return;
    }
    this.m_MouseButtons[MOUSE.ANY].m_Value = false; // set any to be false
    this.m_MouseButtons[MOUSE.ANY].m_Checked = false;

    this.m_MouseButtons[event.button].m_Value = false;
    this.m_MouseButtons[event.button].m_Checked = false;
  };

  #GetKeyIndex(key) {
    if (key.length == 1) {
      // alphanumeric key
      var index = key.toUpperCase().codePointAt(0) - 32; // 32 = space
      return index;
    }

    switch (key) {
      case "Any":
        return 0;

      case "Tab":
        return 1;

      case "CapsLock":
        return 2;

      case "Shift":
        return 3;

      case "Control":
        return 4;

      case "Alt":
        return 5;

      default:
        return -1;
    }
  }
}

const KEY = {
  A: "a",
  B: "b",
  C: "c",
  D: "d",
  E: "e",
  F: "f",
  G: "g",
  H: "h",
  I: "i",
  J: "j",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  O: "o",
  P: "p",
  Q: "q",
  R: "r",
  S: "s",
  T: "t",
  U: "u",
  V: "v",
  W: "w",
  X: "x",
  Y: "y",
  Z: "z",
  SPACE: " ",
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8",
  NINE: "9",
  ZERO: "0",
  SHIFT: 'Shift',
  TAB: 'Tab',
  CAPS: 'CapsLock',
  CTRL: 'Control',
  ALT: 'Alt',
  ANY: "Any",
};

const MOUSE = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
  BUTTON_4: 3,
  BUTTON_5: 4,
  ANY: 5,
};

const eventHandler = new EventManager();
export default { eventHandler, KEY, MOUSE };

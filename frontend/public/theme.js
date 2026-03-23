window.tailwind = window.tailwind || {};
window.tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2e0052",
        "primary-container": "#4b0082",
        "primary-fixed": "#f0dbff",
        "primary-fixed-dim": "#ddb7ff",
        secondary: "#0059bb",
        "secondary-container": "#0070ea",
        "secondary-fixed": "#d8e2ff",
        "secondary-fixed-dim": "#adc7ff",
        tertiary: "#301600",
        "tertiary-fixed": "#ffdcc3",
        outline: "#7d7483",
        "outline-variant": "#cec3d3",
        surface: "#f8f9fa",
        background: "#f8f9fa",
        "surface-bright": "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "surface-variant": "#e1e3e4",
        "on-surface": "#191c1d",
        "on-surface-variant": "#4c4451",
        "on-primary": "#ffffff",
        "on-primary-container": "#ba7ef4",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#fefcff",
        error: "#ba1a1a",
        "error-container": "#ffdad6"
      },
      fontFamily: {
        headline: ["Ubuntu", "sans-serif"],
        body: ["Ubuntu", "sans-serif"],
        label: ["Ubuntu", "sans-serif"]
      },
      boxShadow: {
        glow: "0 30px 80px rgba(46, 0, 82, 0.25)"
      }
    }
  }
};

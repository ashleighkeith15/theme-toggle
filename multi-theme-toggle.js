function colorModeToggle() {
  function attr(defaultVal, attrVal) {
    const defaultValType = typeof defaultVal;
    if (typeof attrVal !== "string" || attrVal.trim() === "") return defaultVal;
    if (attrVal === "true" && defaultValType === "boolean") return true;
    if (attrVal === "false" && defaultValType === "boolean") return false;
    if (isNaN(attrVal) && defaultValType === "string") return attrVal;
    if (!isNaN(attrVal) && defaultValType === "number") return +attrVal;
    return defaultVal;
  }
  
  const htmlElement = document.documentElement;
  const computed = getComputedStyle(htmlElement);
  let toggleEls = {};
  const scriptTag = document.querySelector("[tr-color-vars]");
  
  if (!scriptTag) {
    console.warn("Script tag with tr-color-vars attribute not found");
    return;
  }
  
  let colorModeDuration = attr(0.5, scriptTag.getAttribute("duration"));
  let colorModeEase = attr("power1.out", scriptTag.getAttribute("ease"));
  const cssVariables = scriptTag.getAttribute("tr-color-vars");
  
  if (!cssVariables.length) {
    console.warn("Value of tr-color-vars attribute not found");
    return;
  }

  // Object to store all theme colors - renamed and added new themes
  const themeColors = {
    default: {},  // renamed from "color" to "default"
    purple: {},   // renamed from "dark" to "purple"
    green: {},    // new theme
    blue: {},     // new theme
    orange: {}    // new theme
  };

  // Collect all color variables for each theme
  cssVariables.split(",").forEach(function (item) {
    let defaultValue = computed.getPropertyValue(`--default--${item}`);
    let purpleValue = computed.getPropertyValue(`--purple--${item}`);
    let greenValue = computed.getPropertyValue(`--green--${item}`);
    let blueValue = computed.getPropertyValue(`--blue--${item}`);
    let orangeValue = computed.getPropertyValue(`--orange--${item}`);

    // For backward compatibility, also check for --color-- and --dark--
    if (!defaultValue.length) {
      defaultValue = computed.getPropertyValue(`--color--${item}`);
    }
    if (!purpleValue.length) {
      purpleValue = computed.getPropertyValue(`--dark--${item}`);
    }

    if (defaultValue.length) {
      // Store each theme's value for this variable
      themeColors.default[`--default--${item}`] = defaultValue;
      themeColors.purple[`--default--${item}`] = purpleValue.length ? purpleValue : defaultValue;
      themeColors.green[`--default--${item}`] = greenValue.length ? greenValue : defaultValue;
      themeColors.blue[`--default--${item}`] = blueValue.length ? blueValue : defaultValue;
      themeColors.orange[`--default--${item}`] = orangeValue.length ? orangeValue : defaultValue;
      
      // For backward compatibility, also set --color-- variables
      themeColors.default[`--color--${item}`] = defaultValue;
      themeColors.purple[`--color--${item}`] = purpleValue.length ? purpleValue : defaultValue;
      themeColors.green[`--color--${item}`] = greenValue.length ? greenValue : defaultValue;
      themeColors.blue[`--color--${item}`] = blueValue.length ? blueValue : defaultValue;
      themeColors.orange[`--color--${item}`] = orangeValue.length ? orangeValue : defaultValue;
    }
  });

  if (!Object.keys(themeColors.default).length) {
    console.warn("No variables found matching tr-color-vars attribute value");
    return;
  }

  function setColors(colorObject, animate) {
    if (typeof gsap !== "undefined" && animate) {
      gsap.to(htmlElement, {
        ...colorObject,
        duration: colorModeDuration,
        ease: colorModeEase,
      });
    } else {
      Object.keys(colorObject).forEach(function (key) {
        htmlElement.style.setProperty(key, colorObject[key]);
      });
    }
  }

  function setTheme(themeName, animate) {
    // Remove all theme classes
    htmlElement.classList.remove('purple-mode', 'green-mode', 'blue-mode', 'orange-mode', 'dark-mode');
    
    // Add the specific theme class if it's not the default theme
    if (themeName !== 'default') {
      htmlElement.classList.add(`${themeName}-mode`);
    }
    
    // For backward compatibility with dark-mode
    if (themeName === 'purple') {
      htmlElement.classList.add('dark-mode');
    }

    // Set the theme colors
    setColors(themeColors[themeName], animate);
    
    // Update localStorage
    localStorage.setItem('color-theme', themeName);

    // Update all toggle buttons
    Object.keys(toggleEls).forEach(theme => {
      toggleEls[theme].forEach(element => {
        element.setAttribute('aria-pressed', theme === themeName ? 'true' : 'false');
      });
    });
  }

  // Initialize based on stored preference or system preference
  let storedTheme = localStorage.getItem('color-theme');
  
  // Map old theme names to new ones for backward compatibility
  if (storedTheme === 'color') storedTheme = 'default';
  if (storedTheme === 'dark') storedTheme = 'purple';
  
  if (storedTheme && themeColors[storedTheme]) {
    setTheme(storedTheme, false);
  } else {
    // Check system preference only for purple mode (previously dark mode)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(prefersDark.matches ? 'purple' : 'default', false);
    
    // Listen for system theme changes
    prefersDark.addEventListener('change', (e) => {
      if (!localStorage.getItem('color-theme')) {
        setTheme(e.matches ? 'purple' : 'default', true);
      }
    });
  }

  // Set up toggle buttons when DOM is loaded
  window.addEventListener('DOMContentLoaded', (event) => {
    // Initialize toggle elements for each theme
    toggleEls = {
      default: document.querySelectorAll('[tr-color-toggle="default"], [tr-color-toggle="color"]'),
      purple: document.querySelectorAll('[tr-color-toggle="purple"], [tr-color-toggle="dark"]'),
      green: document.querySelectorAll('[tr-color-toggle="green"]'),
      blue: document.querySelectorAll('[tr-color-toggle="blue"]'),
      orange: document.querySelectorAll('[tr-color-toggle="orange"]')
    };

    // Set up each theme's toggle buttons
    Object.keys(toggleEls).forEach(theme => {
      toggleEls[theme].forEach(element => {
        element.setAttribute('aria-label', `Switch to ${theme} theme`);
        element.setAttribute('role', 'button');
        element.setAttribute('aria-pressed', 'false');
      });
    });

    // Update pressed state for current theme
    const currentTheme = localStorage.getItem('color-theme') || 'default';
    if (toggleEls[currentTheme]) {
      toggleEls[currentTheme].forEach(element => {
        element.setAttribute('aria-pressed', 'true');
      });
    }

    // Add click event listener for all toggle buttons
    document.addEventListener('click', function(e) {
      const targetElement = e.target.closest('[tr-color-toggle]');
      if (targetElement) {
        let theme = targetElement.getAttribute('tr-color-toggle');
        
        // Map old theme names to new ones
        if (theme === 'color') theme = 'default';
        if (theme === 'dark') theme = 'purple';
        
        if (themeColors[theme]) {
          setTheme(theme, true);
        }
      }
    });
  });
}

colorModeToggle();

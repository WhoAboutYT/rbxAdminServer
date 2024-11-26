/* -- Import Libraries -- */
const { execSync } = require('node:child_process');
const readline = require('node:readline');
const fs = require('node:fs');
const net = require('node:net');

/* -- Global Readline Interface -- */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * Asks the user a question.
 * @param {String} question
 * @returns {Promise}
 */
const askUser = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim().toLowerCase());
        });
    });
};

/**
 *  closes the readline interface.
 */
const closeReadline = () => {
    rl.close();
};

/* -- Check for Required Deps -- */
const requiredDeps = ["express"];

/**
 * Checks if a dependency is installed.
 * @param {String} dependency
 * @returns {Boolean} True if it is installed, False if it is not.
 */
const isDependencyInstalled = (dependency) => {
    try {
        require.resolve(dependency);
        return true;
    } catch {
        return false;
    }
};

/**
 * Installs the dependency after asking the user.
 * @param {String} dep
 * @returns {null} If success, it will return null. If not, it will return the dependency name back
 */
const installDependency = async (dep) => {
    const answer = await askUser(`Do you want to install "${dep}"? (yes/no): `);

    if (answer === "yes") {
        try {
            console.log(`Installing "${dep}"...`);
            execSync(`npm install ${dep}`, { stdio: "inherit" });
            console.log(`"${dep}" installed successfully!`);
        } catch (error) {
            console.error(`Failed to install "${dep}". Error: ${error.message}`);
        }
    } else {
        return dep;
    }
    return null;
};

/**
 * Checks and installs missing dependencies.
 * @param {String[]} dependencies
 */
const checkAndInstallDependencies = async (dependencies) => {
    const missingDependencies = dependencies.filter((dep) => !isDependencyInstalled(dep));
    const declinedDependencies = [];

    for (const dep of missingDependencies) {
        const declined = await installDependency(dep);
        if (declined) {
            declinedDependencies.push(declined);
        }
    }

    if (declinedDependencies.length > 0) {
        console.log("\nThe following dependencies were not installed:");
        console.log(declinedDependencies.join("\n"));
        console.log("\nYou can install them manually with the following commands:");
        declinedDependencies.forEach((dep) => console.log(`npm install ${dep}`));
    } else {
        console.log("\n✅ [bootupchecks.js] All dependencies are installed!");
    }
};

/* ------------------------------------------------------------------------------------ */
/*                                Check  Ports                                          */
/* ------------------------------------------------------------------------------------ */

/**
 * Checks if a port is valid.
 * @param {number} port
 * @returns {boolean} True if valid, false otherwise.
 */
const isPortValid = (port) => port >= 1 && port <= 65535;

/**
 * Checks if a port is in use.
 * @param {number} port
 * @returns {Promise<boolean>} True if in use, false otherwise.
 */
const isPortInUse = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer()
            .once("error", () => resolve(true)) // Port in use
            .once("listening", () => {
                server.close(() => resolve(false)); // Port available
            })
            .listen(port);
    });
};

/**
 * Reads and validates the port from config.json.
 */
const checkAndSetPort = async () => {
    const configPath = "./config.json";
    let config;

    try {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
        console.error(`[bootupchecks.js] Failed to read config.json: ${error.message}`);
        return;
    }

    let port = config.port;

    if (!port || !isPortValid(port) || (await isPortInUse(port))) {
        console.log(`\nThe port "${port}" is invalid or in use.`);

        while (true) {
            const answer = await askUser("Enter a new port: ");
            const newPort = parseInt(answer, 10);

            if (!isPortValid(newPort)) {
                console.log("❌ [bootupchecks.js] Invalid port. Please enter a number between 1 and 65535.");
                continue;
            }

            if (await isPortInUse(newPort)) {
                console.log("❌ [bootupchecks.js] Port is already in use. Try a different one.");
                continue;
            }

            config.port = newPort;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`✅ [bootupchecks.js] Port has been updated to ${newPort} and saved in config.json.`);
            break;
        }
    } else {
        console.log(`✅ [bootupchecks.js] The current port (${port}) is valid and available.`);
    }
};

/* ------------------------------------------------------------------------------------ */
/*                               END OF FILE                                            */
/* ------------------------------------------------------------------------------------ */

(async () => {
    await checkAndInstallDependencies(requiredDeps);
    await checkAndSetPort();
    closeReadline();
})();

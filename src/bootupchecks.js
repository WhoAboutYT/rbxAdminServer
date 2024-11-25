/* -- Import Libraries -- */

const { execSync } = require('node:child_process');
const readline = require('node:readline')


/*- Check for Required Deps -*/

const requiredDeps = [
    "express"
];

/**
 * Checks if a dependency is installed.
 * @param {String} dependency 
 * @returns {Boolean} True if it is installed, False if it is not.
 */
const isDependencyInstalled = (dependency) => {
    //* This Tries To Get the Dependency. If an error comes, then its not there *//
    try {
        require.resolve(dependency);
        return true;
    } catch {
        return false;
    }
}

/**
 * Asks the user a question that you provide.
 * @param {String} question 
 * @returns {Promise}
 */
const askUser = (question) => {
    //* This uses the readline library built into node.js to ask the user qestions *//
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
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
        //* Return the dependency if it is not installed. *//
        return dep;
    }
    //* If it is installed with no failures, returns null *//
    return null; 
};

/**
 * This checks if dependencies are there, and if its not it will install it. 
 * Depends on these functions: isDependencyInstalled, installDependency.
 * These functions may also depend on other functions
 * @param {String[]} dependencies 
 */
const checkAndInstallDependencies = async (dependencies) => {
    const missingDependencies = dependencies.filter(dep => !isDependencyInstalled(dep));
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
        declinedDependencies.forEach(dep => console.log(`npm install ${dep}`));
    } else {
        console.log("\n✅ [bootupchecks.js] All dependencies are installed!");
    }
};

checkAndInstallDependencies(requiredDeps);
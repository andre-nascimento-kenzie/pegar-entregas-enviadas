const script = async () => {
    try {
        const div = document.createElement("div");
        const result = document.getElementById(
            "replacement_notice_mount_point"
        );
        result.innerHTML = "";
        div.style.width = "80%";
        div.style.height = "200px";
        div.style.overflowY = "scroll"
        div.style.border = "2px solid black";
        div.style.backgroundColor = "#1C1C1C";
        div.style.color = "#FFFFFF";
        div.style.position = "absolute";
        div.style.left = "10%";
        div.style.top = "0";
        div.style.zIndex = 5;
        div.style.padding = "50px"
        div.style.boxSizing = "border-box"
        div.style.borderRadius = "10px"
        div.id = "result-box";
        result.appendChild(div);
        const $ = {
            get: (url) =>
                new Promise((resolve, reject) => {
                    try {
                        const httpRequest = new XMLHttpRequest();
                        httpRequest.open("GET", url, true);
                        httpRequest.send();
                        httpRequest.onreadystatechange = function () {
                            if (httpRequest.readyState === XMLHttpRequest.DONE)
                                resolve(
                                    JSON.parse(
                                        httpRequest.response.replace(
                                            "while(1);",
                                            ""
                                        )
                                    )
                                );
                        };
                    } catch (error) {
                        reject(error);
                    }
                }),
            handleGetJsonLinks: (courseId, sprint) => {
                const jsonLinks = [];
                const anchorTagClasses = "assignment-name";

                const anchorTags =
                    document.getElementsByClassName(anchorTagClasses);
                const resultBox = document.getElementById("result-box");
                for (let index in anchorTags) {
                    const anchorTag = anchorTags[index];
                    const splitedHrefLink = String(anchorTag["href"]).split(
                        "/"
                    );
                    const assignmentId = splitedHrefLink.pop();

                    if (assignmentId !== "undefined") {
                        const titulo = anchorTag.textContent;
                        if (
                            !titulo.includes("Extra") &&
                            !titulo.includes("Presença") &&
                            titulo.includes(`S${sprint}`) &&
                            titulo !== ""
                        ) {
                            const p = document.createElement("p");
                            p.innerText = titulo;
                            resultBox.appendChild(p);
                            jsonLinks.push(
                                `https://alunos2.kenzie.com.br/courses/${courseId}/gradebook/speed_grader.json?assignment_id=${assignmentId}`
                            );
                        }
                    }
                }
                return jsonLinks;
            },
            handleGetAssignments: async (urls) => {
                const promises = [];
                for (let url of urls) {
                    promises.push($.get(url));
                }
                const assignments = await Promise.all(promises);
                return assignments;
            },
            handleConvertToCsv: (submissions) => {
                const tabeta = [[]];
                let maior = 0;
                for (let assignmentId in submissions) {
                    const submission = submissions[assignmentId];
                    if (submission.length > maior) {
                        maior = submission.length;
                    }
                    tabeta[0].push(assignmentId);
                }
                for (let index = 1; index < maior; index++) {
                    for (let assignmentId in submissions) {
                        const submission = submissions[assignmentId];
                        if (tabeta[index]) {
                            tabeta[index].push(submission.shift());
                        } else {
                            tabeta[index] = [];
                            tabeta[index].push(submission.shift());
                        }
                    }
                }
                return tabeta.map((list) => list.join(",")).join("\n");
            },
        };

        const { courseId } = await chrome.storage.sync.get("courseId");
        const submissions = {};
        let assignments = [];
        for (let sprint = 1; sprint <= 8; sprint++) {
            const urls = await $.handleGetJsonLinks(courseId, sprint);
            assignments = await $.handleGetAssignments(urls);
            for (const assignment of assignments) {
                submissions[assignment.title] = assignment.submissions.reduce(
                    (acumulator, submission) => {
                        if (submission.submitted_at) {
                            return [...acumulator, submission.user_id];
                        }
                        return [...acumulator];
                    },
                    []
                );
            }
        }
        result.innerHTML = "";
        const csv = $.handleConvertToCsv(submissions);
        const hiddenElement = document.createElement("a");
        hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
        hiddenElement.target = "_blank";
        hiddenElement.download = "Entregas enviadas.csv";
        hiddenElement.click();
    } catch (err) {
        console.log(err);
    }
};

const script = async () => {
    const result = document.querySelector("body");
    const div = document.createElement("div");
    try {
        const formattedDate = new Date().toISOString();
        const { courseId } = await chrome.storage.sync.get("courseId");
        const submissions = {};
        const graded = {};
        let assignments = [];

        const handleCreateBox = () => {
            div.style.width = "80%";
            div.style.height = "200px";
            div.style.overflowY = "scroll";
            div.style.border = "2px solid black";
            div.style.backgroundColor = "#1C1C1C";
            div.style.color = "#FFFFFF";
            div.style.position = "absolute";
            div.style.left = "10%";
            div.style.top = "0";
            div.style.zIndex = 10;
            div.style.padding = "50px";
            div.style.boxSizing = "border-box";
            div.style.borderRadius = "10px";
            div.id = "result-box";
            result.appendChild(div);
        };

        handleCreateBox();

        const get = (url) =>
            fetch(url, {
                method: "GET",
                mode: "no-cors",
                headers: {
                    Authorization:
                        "Bearer KcPYHOOkLOklpLiq3yk1Qrugu5BGIaSMrZD4PlB2SjYyxUVa2K2RBmHuNJ6IDrnM",
                },
            }).then((res) => res.json());

        const handleGetJsonLinks = (courseId, sprint) => {
            const jsonLinks = [];
            const anchorTagClasses = "fOyUs_bGBk fbyHH_bGBk fbyHH_bSMN";

            const anchorTags =
                document.getElementsByClassName(anchorTagClasses);
            const resultBox = document.getElementById("result-box");
            for (let index in anchorTags) {
                const anchorTag = anchorTags[index];
                const splitedHrefLink = String(anchorTag["href"]).split("/");
                const assignmentId = splitedHrefLink.pop();

                if (assignmentId !== "undefined") {
                    const title = anchorTag.textContent;
                    if (
                        !title.includes("Extra") &&
                        !title.includes("Presença") &&
                        !title.includes("Empregabilidade") &&
                        !title.includes("Quiz") &&
                        title.includes(`S${sprint}`) &&
                        title !== ""
                    ) {
                        const p = document.createElement("p");
                        p.innerText = title;
                        resultBox.appendChild(p);
                        jsonLinks.push(
                            `https://canvas.kenzie.com.br/courses/${courseId}/gradebook/speed_grader.json?assignment_id=${assignmentId}`
                        );
                    }
                }
            }
            return jsonLinks;
        };

        const handleGetAssignments = async (urls) => {
            const promises = [];
            for (let url of urls) {
                promises.push(get(url));
            }
            const assignments = await Promise.all(promises);
            return assignments;
        };

        const handleConvertSubmittedToCsv = (submissions) => {
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
        };

        const handleConvertGradedToCsv = (graded) => {
            let csv = [];
            for (const name in graded) {
                const qtd = graded[name];
                csv.push(`${name}, ${qtd}`);
            }
            csv = csv.join("\n");
            return csv;
        };

        const handleDownloadCsv = (csv, fileName) => {
            const hiddenElement = document.createElement("a");
            hiddenElement.href =
                "data:text/csv;charset=utf-8," + encodeURI(csv);
            hiddenElement.target = "_blank";
            hiddenElement.download = `${fileName}.csv`;
            hiddenElement.click();
        };

        for (let sprint = 1; sprint <= 8; sprint++) {
            const urls = await handleGetJsonLinks(courseId, sprint);
            assignments = await handleGetAssignments(urls);
            for (const assignment of assignments) {
                submissions[assignment.title] = assignment.submissions.reduce(
                    (acumulator, submission) => {
                        if (submission.submitted_at) {
                            if (submission.workflow_state === "graded") {
                                const comments =
                                    submission.submission_comments.filter(
                                        (comment) =>
                                            comment.authorId !==
                                            submission.user_id
                                    );
                                comments.forEach((comment) => {
                                    if (graded[comment.author_name]) {
                                        graded[comment.author_name]++;
                                    } else {
                                        graded[comment.author_name] = 1;
                                    }
                                });
                            }

                            return [...acumulator, submission.user_id];
                        }
                        return [...acumulator];
                    },
                    []
                );
            }
        }

        result.removeChild(div);
        const submittedAssignmentsCsv =
            handleConvertSubmittedToCsv(submissions);
        const gradedCsv = handleConvertGradedToCsv(graded);

        handleDownloadCsv(
            submittedAssignmentsCsv,
            `Entregas_enviadas_${formattedDate}`
        );
        handleDownloadCsv(gradedCsv, `Entregas_corrigidas_${formattedDate}`);
    } catch (err) {
        result.removeChild(div);
        console.log(err);
    }
};

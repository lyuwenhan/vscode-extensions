const linksEle = document.getElementById("links");
fetch("./versions.json").then(response => response.json()).then(e => Object.entries(e).filter(e => e[0] && e[1] && e[1]?.length).map(e => {
	const rev = e[1].toReversed();
	if (rev.length) {
		const rev2 = rev.splice(0, 5);
		const ele = document.createElement("details");
		ele.id = "links-" + e[0];
		ele.classList.add("linksEle");
		const ele1 = document.createElement("summary");
		const ele2 = document.createElement("h2");
		ele2.innerText = e[0];
		ele2.classList.add("extension-name");
		ele1.insertAdjacentElement("beforeend", ele2);
		ele.insertAdjacentElement("beforeend", ele1);
		const makeLink = (ele, content, version) => {
			const aEle = document.createElement("a");
			aEle.href = `extensions/${e[0]}-${version}.vsix`;
			aEle.innerText = content;
			ele.insertAdjacentElement("beforeend", aEle);
			ele.insertAdjacentHTML("beforeend", "<br>")
		};
		const ele3 = document.createElement("ul");
		if (rev2.length) {
			rev2.forEach(ver => {
				const liEle = document.createElement("li");
				makeLink(liEle, `Version ${ver}`, ver);
				ele3.insertAdjacentElement("beforeend", liEle)
			})
		}
		if (rev.length) {
			const liEle1 = document.createElement("li");
			const det = document.createElement("details");
			det.insertAdjacentHTML("beforeend", "<summary>Historical versions</summary>");
			const ulELe = document.createElement("ul");
			rev.forEach(ver => {
				const liEle = document.createElement("li");
				makeLink(liEle, `Version ${ver}`, ver);
				ulELe.insertAdjacentElement("beforeend", liEle)
			});
			det.insertAdjacentElement("beforeend", ulELe);
			liEle1.insertAdjacentElement("beforeend", det)
			ele3.insertAdjacentElement("beforeend", liEle1)
		}
		ele.insertAdjacentElement("beforeend", ele3);
		linksEle.insertAdjacentElement("beforeend", ele)
	}
}));

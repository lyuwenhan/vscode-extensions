const linksEle = document.getElementById("links");
fetch("./versions.json").then(response => response.json()).then(e => Object.entries(e).filter(e => e[0] && e[1] && e[1]?.length).map(e => {
	const rev = e[1].toReversed();
	if (rev.length) {
		const ele = document.createElement("details");
		ele.id = "links-" + e[0];
		ele.classList.add("linksEle");
		const ele1 = document.createElement("summary");
		const ele2 = document.createElement("h2");
		ele2.innerText = e[0];
		ele2.classList.add("extension-name");
		ele1.insertAdjacentElement("beforeend", ele2);
		ele.insertAdjacentElement("beforeend", ele1);
		const makeLink = version => {
			const liEle = document.createElement("li");
			const aEle = document.createElement("a");
			aEle.href = `extensions/${e[0]}-${version}.vsix`;
			aEle.innerText = `Version ${version}`;
			liEle.insertAdjacentElement("beforeend", aEle);
			ele3.insertAdjacentElement("beforeend", liEle)
		};
		const ele3 = document.createElement("ul");
		for (let i = 0; rev.length && i < 5; i++) {
			makeLink(rev.shift())
		}
		if (rev.length) {
			ele3.insertAdjacentHTML("beforeend", '<li class="lisum"><details><summary>Historical versions</summary></details></li>');
			rev.forEach(makeLink)
		}
		ele.insertAdjacentElement("beforeend", ele3);
		linksEle.insertAdjacentElement("beforeend", ele)
	}
}));

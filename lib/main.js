const linksEle = document.getElementById("links");
fetch("./versions.json").then(response => response.json()).then(e => Object.entries(e).filter(e => e[0] && e[1] && e[1]?.length).map(e => {
	const ele = document.createElement("div");
	ele.id = "links-" + e[0];
	ele.classList.add("linksEle");
	const ele1 = document.createElement("h2");
	ele1.innerText = e[0];
	ele.insertAdjacentElement("beforeend", ele1);
	const makeLink = (ele, content, version) => {
		const aEle = document.createElement("a");
		aEle.href = `extensions/${e[0]}-${version}.vsix`;
		aEle.innerText = content;
		ele.insertAdjacentElement("beforeend", aEle);
		ele.insertAdjacentHTML("beforeend", "<br>")
	};
	const rev = e[1].toReversed();
	const rev2 = rev.splice(0, 5);
	if (rev2.length) {
		rev2.forEach(ver => {
			makeLink(ele, `Version ${ver}`, ver)
		})
	}
	if (rev.length) {
		const det = document.createElement("details");
		det.insertAdjacentHTML("beforeend", "<summary>Historical versions</summary>");
		const ulELe = document.createElement("ul");
		rev.forEach(ver => {
			const liEle = document.createElement("li");
			makeLink(liEle, `Version ${ver}`, ver);
			ulELe.insertAdjacentElement("beforeend", liEle)
		});
		det.insertAdjacentElement("beforeend", ulELe);
		ele.insertAdjacentElement("beforeend", det)
	}
	linksEle.insertAdjacentElement("beforeend", ele)
}));

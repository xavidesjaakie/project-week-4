document.addEventListener("DOMContentLoaded", () => {
    const rekeningSelect = document.getElementById("rekeningSelect");
    const saldoDisplay = document.getElementById("saldoDisplay");
    const transactionList = document.getElementById("transaction-list");
    const bedragInput = document.getElementById("bedragInput");
    const toevoegenButton = document.getElementById("toevoegen");
    const afnemenButton = document.getElementById("afnemen");
    const naarRekeningSelect = document.getElementById("naarRekeningSelect");
    const overschrijvingBedrag = document.getElementById("overschrijvingBedrag");
    const overschrijvenButton = document.getElementById("overschrijven");

    const rekeningenKey = "rekeningen";
    const transactiesKey = "transacties";
    let rekeningen = JSON.parse(localStorage.getItem(rekeningenKey)) || {};
    let transacties = JSON.parse(localStorage.getItem(transactiesKey)) || {};

    function updateRekeningenSelect() {
        rekeningSelect.innerHTML = "";
        for (let rekening in rekeningen) {
            const option = document.createElement("option");
            option.value = rekening;
            option.textContent = rekening;
            rekeningSelect.appendChild(option);
        }
        if (rekeningSelect.options.length > 0) {
            rekeningSelect.value = rekeningSelect.options[0].value;
            updateSaldoDisplay();
            updateNaarRekeningSelect();
        }
    }

    function updateSaldoDisplay() {
        const huidigeRekening = rekeningSelect.value;
        saldoDisplay.textContent = `€${(rekeningen[huidigeRekening] || 0).toFixed(2)}`;
        updateTransactionList();
    }

    function updateTransactionList() {
        const huidigeRekening = rekeningSelect.value;
        const rekeningTransacties = transacties[huidigeRekening] || [];
        transactionList.innerHTML = "";
        rekeningTransacties.forEach(transactie => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="transactie-id">[ID ${transactie.id}]</span> 
                ${transactie.type} €${transactie.bedrag.toFixed(2)} 
                <br><small>${new Date(transactie.datum).toLocaleString()}</small>`;
            transactionList.appendChild(li);
        });
    }

    function updateNaarRekeningSelect() {
        const huidigeRekening = rekeningSelect.value;
        naarRekeningSelect.innerHTML = "";
        for (let rekening in rekeningen) {
            if (rekening !== huidigeRekening) { // Excludeer de huidige rekening
                const option = document.createElement("option");
                option.value = rekening;
                option.textContent = rekening;
                naarRekeningSelect.appendChild(option);
            }
        }
    }

    function wijzigSaldo(bedrag, type) {
        const huidigeRekening = rekeningSelect.value;
        if (!huidigeRekening) return;

        const nieuwSaldo = (rekeningen[huidigeRekening] || 0) + bedrag;
        if (nieuwSaldo < 0) {
            alert("Onvoldoende saldo!");
            return;
        }

        rekeningen[huidigeRekening] = nieuwSaldo;
        localStorage.setItem(rekeningenKey, JSON.stringify(rekeningen));
        updateSaldoDisplay();
        voegTransactieToe(type, Math.abs(bedrag));
    }

    function voegTransactieToe(type, bedrag) {
        const huidigeRekening = rekeningSelect.value;
        if (!huidigeRekening) return;

        const nieuweTransactie = {
            id: (transacties[huidigeRekening]?.length || 0) + 1,
            type: type,
            bedrag: bedrag,
            datum: new Date().toISOString(),
        };

        if (!transacties[huidigeRekening]) {
            transacties[huidigeRekening] = [];
        }
        transacties[huidigeRekening].push(nieuweTransactie);
        localStorage.setItem(transactiesKey, JSON.stringify(transacties));
        updateTransactionList();
    }

    function overschrijvingUitvoeren() {
        const huidigeRekening = rekeningSelect.value;
        const doelRekening = naarRekeningSelect.value;
        const bedrag = parseFloat(overschrijvingBedrag.value);

        if (!doelRekening) {
            alert("Selecteer een doelrekening.");
            return;
        }

        if (isNaN(bedrag) || bedrag <= 0) {
            alert("Voer een geldig positief bedrag in.");
            return;
        }

        if ((rekeningen[huidigeRekening] || 0) < bedrag) {
            alert("Onvoldoende saldo voor deze overschrijving.");
            return;
        }

        // Update saldi
        rekeningen[huidigeRekening] -= bedrag;
        rekeningen[doelRekening] = (rekeningen[doelRekening] || 0) + bedrag;

        // Update transacties
        voegTransactieToe("Overschrijving naar " + doelRekening, -bedrag);
        if (!transacties[doelRekening]) {
            transacties[doelRekening] = [];
        }
        transacties[doelRekening].push({
            id: (transacties[doelRekening]?.length || 0) + 1,
            type: "Overschrijving van " + huidigeRekening,
            bedrag: bedrag,
            datum: new Date().toISOString(),
        });

        // Opslaan in localStorage
        localStorage.setItem(rekeningenKey, JSON.stringify(rekeningen));
        localStorage.setItem(transactiesKey, JSON.stringify(transacties));

        // UI bijwerken
        updateSaldoDisplay();
        updateTransactionList();
        alert(`€${bedrag.toFixed(2)} is succesvol overgeschreven naar ${doelRekening}.`);
        overschrijvingBedrag.value = "";
    }

    document.getElementById("nieuweRekening").addEventListener("click", () => {
        const nieuweNaam = prompt("Voer een naam in voor de nieuwe rekening:");
        if (nieuweNaam && !rekeningen[nieuweNaam]) {
            rekeningen[nieuweNaam] = 0;
            transacties[nieuweNaam] = [];
            localStorage.setItem(rekeningenKey, JSON.stringify(rekeningen));
            localStorage.setItem(transactiesKey, JSON.stringify(transacties));
            updateRekeningenSelect();
        }
    });

    rekeningSelect.addEventListener("change", () => {
        updateSaldoDisplay();
        updateNaarRekeningSelect();
    });

    toevoegenButton.addEventListener("click", () => {
        const bedrag = parseFloat(bedragInput.value);
        if (!isNaN(bedrag) && bedrag > 0) {
            wijzigSaldo(bedrag, "Toegevoegd");
            bedragInput.value = "";
        } else {
            alert("Voer een geldig positief bedrag in.");
        }
    });

    afnemenButton.addEventListener("click", () => {
        const bedrag = parseFloat(bedragInput.value);
        if (!isNaN(bedrag) && bedrag > 0) {
            wijzigSaldo(-bedrag, "Afgenomen");
            bedragInput.value = "";
        } else {
            alert("Voer een geldig positief bedrag in.");
        }
    });

    overschrijvenButton.addEventListener("click", overschrijvingUitvoeren);

    updateRekeningenSelect();
});

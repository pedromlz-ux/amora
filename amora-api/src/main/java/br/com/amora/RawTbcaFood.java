package br.com.amora;

import java.util.List;

public class RawTbcaFood {
    public String codigo;
    public String classe;
    public String descricao;
    public List<Nutriente> nutrientes;

    public static class Nutriente {
        public String Componente;
        public String Unidades;
        public String ValorPor100g; // we need to map "Valor por 100g" using Jackson annotation or custom deserialization

        // To map "Valor por 100g" with spaces
        @com.fasterxml.jackson.annotation.JsonProperty("Valor por 100g")
        public void setValorPor100g(String valorPor100g) {
            this.ValorPor100g = valorPor100g;
        }
    }
}

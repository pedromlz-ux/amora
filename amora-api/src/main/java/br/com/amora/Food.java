package br.com.amora;

import java.util.Map;
import java.util.HashMap;
import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;

public class Food {
    public Long id;
    public String description;
    public String category;

    private Map<String, Object> nutritionData = new HashMap<>();

    @JsonAnyGetter
    public Map<String, Object> getNutritionData() {
        return nutritionData;
    }

    @JsonAnySetter
    public void setNutritionData(String name, Object value) {
        nutritionData.put(name, value);
    }
}
